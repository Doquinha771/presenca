-- Importação institucional: arquivos são lidos no navegador; somente linhas aprovadas
-- chegam ao Supabase em lotes pequenos. Não executar sql/01_portal.sql novamente.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';

CREATE OR REPLACE FUNCTION public.portal_import_batch(p_kind text,p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $import$
DECLARE
 me public.profiles;
 item jsonb;
 cl public.school_classes;
 pupil public.profiles;
 existing uuid;
 event_id bigint;
 ra text;
 name_ text;
 grade_ text;
 class_ text;
 birth_ date;
 occurred_ timestamptz;
 request_ uuid;
 reason_ text;
 justified_ boolean;
 added integer:=0;
 skipped integer:=0;
 line_no integer;
 result jsonb;
BEGIN
 me:=private.require_portal();
 IF p_kind NOT IN ('classes','enrollments','lateness') THEN RAISE EXCEPTION 'Tipo de importação inválido' USING errcode='22023'; END IF;
 IF me.role<>'admin' AND NOT (p_kind='enrollments' AND me.role='secretaria') THEN
  RAISE EXCEPTION 'Importação reservada à Direção ou secretaria autorizada' USING errcode='42501';
 END IF;
 IF p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 25 THEN
  RAISE EXCEPTION 'Envie de 1 a 25 linhas por lote' USING errcode='22023';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(21945,17);
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  IF jsonb_typeof(item)<>'object' THEN RAISE EXCEPTION 'Linha não é um objeto'; END IF;
  line_no:=coalesce((item->>'line')::integer,0);
  IF p_kind='classes' THEN
   grade_:=trim(coalesce(item->>'grade',''));
   class_:=trim(coalesce(item->>'name',''));
   IF length(grade_) NOT BETWEEN 1 AND 70 OR length(class_) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Linha %: série/turma inválida',line_no;
   END IF;
   INSERT INTO public.school_classes(grade,name,active)
    VALUES(grade_,class_,true)
    ON CONFLICT(grade,name) DO NOTHING RETURNING id INTO existing;
   IF existing IS NULL THEN skipped:=skipped+1; ELSE added:=added+1; END IF;
   existing:=NULL;
  ELSIF p_kind='enrollments' THEN
   ra:=lower(trim(coalesce(item->>'ra','')));
   name_:=trim(coalesce(item->>'name',''));
   grade_:=trim(coalesce(item->>'grade',''));
   class_:=trim(coalesce(item->>'class',''));
   IF ra !~ '^[0-9]{7,16}(sp)?$' OR length(name_) NOT BETWEEN 3 AND 120 THEN
     RAISE EXCEPTION 'Linha %: RA ou nome inválido',line_no;
   END IF;
   birth_:=(item->>'birth')::date;
   IF birth_>current_date OR birth_<current_date-interval '110 years' THEN
     RAISE EXCEPTION 'Linha %: data de nascimento inválida',line_no;
   END IF;
   SELECT * INTO cl FROM public.school_classes
    WHERE grade=grade_ AND name=class_ AND active LIMIT 1;
   IF NOT FOUND THEN RAISE EXCEPTION 'Linha %: turma % / % não cadastrada ou inativa',line_no,grade_,class_; END IF;
   PERFORM 1 FROM public.school_enrollments e WHERE e.ra=ra;
   IF FOUND THEN
     skipped:=skipped+1;
   ELSE
     result:=private.portal_write('enrollment',jsonb_build_object(
      'ra',ra,'email',ra||'@al.educacao.sp.gov.br','name',name_,
      'birth',birth_::text,'class',cl.id,'active',true));
     added:=added+1;
   END IF;
  ELSE
   ra:=lower(trim(coalesce(item->>'ra','')));
   IF ra !~ '^[0-9]{7,16}(sp)?$' THEN RAISE EXCEPTION 'Linha %: RA inválido',line_no; END IF;
   SELECT p.* INTO pupil FROM public.profiles p
    WHERE p.ra=ra AND p.role='aluno' AND p.enrollment_approved AND p.active
     AND p.archived_at IS NULL AND p.class_id IS NOT NULL FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Linha %: aluno sem conta escolar ativa e matrícula validada',line_no; END IF;
   reason_:=trim(coalesce(item->>'reason',''));
   IF length(reason_)>500 THEN RAISE EXCEPTION 'Linha %: observação muito longa',line_no; END IF;
   request_:=(item->>'request')::uuid;
   IF request_ IS NULL THEN RAISE EXCEPTION 'Linha %: identificador obrigatório',line_no; END IF;
   IF coalesce(item->>'time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Linha %: horário inválido',line_no; END IF;
   occurred_:=((item->>'date')||' '||(item->>'time'))::timestamp AT TIME ZONE 'America/Sao_Paulo';
   IF occurred_>clock_timestamp() OR occurred_<'2020-01-01'::date THEN
    RAISE EXCEPTION 'Linha %: data do atraso fora do intervalo permitido',line_no;
   END IF;
   justified_:=coalesce((item->>'justified')::boolean,false);
   INSERT INTO public.attendance_events
    (student_id,operator_id,reason,request_id,occurred_at,justified,status)
    VALUES(pupil.id,me.id,reason_,request_,occurred_,justified_,'active')
    ON CONFLICT(request_id) DO NOTHING RETURNING id INTO event_id;
   IF event_id IS NULL THEN
    PERFORM 1 FROM public.attendance_events e WHERE e.request_id=request_
     AND e.student_id=pupil.id AND e.occurred_at=occurred_;
    IF NOT FOUND THEN RAISE EXCEPTION 'Linha %: identificador da ocorrência já utilizado',line_no; END IF;
    skipped:=skipped+1;
   ELSE
    IF occurred_>=pupil.count_from THEN
     UPDATE public.profiles SET late_count=late_count+1 WHERE id=pupil.id;
    END IF;
    PERFORM private.recount(pupil.id);
    added:=added+1;
   END IF;
   event_id:=NULL;
  END IF;
 END LOOP;
 INSERT INTO public.audit_events(actor_id,action,detail)
 VALUES(me.id,'IMPORT_'||upper(p_kind),jsonb_build_object('novos',added,'repetidos',skipped)::text);
 RETURN jsonb_build_object('added',added,'skipped',skipped);
END;
$import$;
REVOKE ALL ON FUNCTION public.portal_import_batch(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.portal_import_batch(text,jsonb) TO authenticated;
INSERT INTO public.portal_migrations(version) VALUES('5.0.0') ON CONFLICT(version) DO NOTHING;
COMMIT;
