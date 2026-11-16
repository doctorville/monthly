-- 기존 schema.sql 적용 후 실행. 기존 보고와 팀원은 보존합니다.
begin;
alter table public.members add column if not exists role text not null default 'member'
  check (role in ('member','admin'));
alter table public.reports add column if not exists updated_by uuid references auth.users(id) on delete set null;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.members where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
drop policy if exists report_update on public.reports;
create policy report_update on public.reports for update to authenticated
 using (public.is_member() and (user_id=(select auth.uid()) or (public.is_admin() and status='submitted')))
 with check (public.is_member() and (user_id=(select auth.uid()) or (public.is_admin() and status='submitted')));
grant update(name,team) on public.members to authenticated;
drop policy if exists member_admin_update on public.members;
create policy member_admin_update on public.members for update to authenticated
 using (public.is_admin()) with check (public.is_admin());
create or replace function public.report_update_audit() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and new.user_id is distinct from old.user_id then
  raise exception '보고 작성자는 변경할 수 없습니다';
 end if;
 new.updated_by=auth.uid(); return new;
end $$;
drop trigger if exists report_update_audit on public.reports;
create trigger report_update_audit before insert or update on public.reports
 for each row execute function public.report_update_audit();
commit;

-- 팀원 등록은 사이트의 팀원 관리 화면(관리자)에서 합니다. 개인 이메일은 저장소에 두지 않습니다.
