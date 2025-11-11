-- Question bank enhancements: ownership, assets, institution PDF sets, RPC builder
create type question_owner_type as enum ('platform', 'institution', 'teacher');
create type question_visibility as enum ('private', 'institution_only', 'public');
create type question_asset_type as enum ('image', 'pdf', 'audio', 'video');

alter table questions
  add column if not exists owner_type question_owner_type not null default 'platform',
  add column if not exists owner_id uuid,
  add column if not exists visibility question_visibility not null default 'public';

alter table questions
  add constraint question_owner_consistency check (
    (owner_type = 'platform' and owner_id is null)
    or (owner_type in ('institution','teacher') and owner_id is not null)
  );

create index if not exists idx_questions_subject_topic_diff on questions (subject, topic, difficulty);
create index if not exists idx_questions_tags_gin on questions using gin (tags);
create index if not exists idx_questions_owner on questions (owner_type, owner_id);

create table if not exists question_assets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  asset_type question_asset_type not null,
  title text,
  description text,
  url text not null,
  created_at timestamptz default now()
);

create table if not exists institution_question_sets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  title text not null,
  description text,
  pdf_url text not null,
  tags text[] default '{}',
  visibility question_visibility not null default 'institution_only',
  created_by uuid references teachers(id),
  created_at timestamptz default now()
);

create or replace function build_questions(filters jsonb)
returns setof questions
language plpgsql
security definer
as $$
declare
  limit_value integer := greatest(1, least(coalesce((filters->>'limit')::int, 10), 200));
  subject_list text[];
  topic_list text[];
  difficulty_list question_difficulty[];
  owner_scope text := filters->>'owner_scope';
  allowed_owner_ids uuid[];
begin
  if filters ? 'subjects' then
    subject_list := array(select jsonb_array_elements_text(filters->'subjects'));
  elsif filters ? 'subject' then
    subject_list := array[filters->>'subject'];
  end if;

  if filters ? 'topics' then
    topic_list := array(select jsonb_array_elements_text(filters->'topics'));
  elsif filters ? 'topic' then
    topic_list := array[filters->>'topic'];
  end if;

  if filters ? 'difficulties' then
    difficulty_list := array(
      select (jsonb_array_elements_text(filters->'difficulties'))::question_difficulty
    );
  elsif filters ? 'difficulty' then
    difficulty_list := array[(filters->>'difficulty')::question_difficulty];
  end if;

  if filters ? 'owner_ids' then
    allowed_owner_ids := array(select (jsonb_array_elements_text(filters->'owner_ids'))::uuid);
  elsif filters ? 'owner_id' then
    allowed_owner_ids := array[(filters->>'owner_id')::uuid];
  end if;

  return query
    select *
    from questions
    where is_active
      and (subject_list is null or subject = any(subject_list))
      and (topic_list is null or topic = any(topic_list))
      and (difficulty_list is null or difficulty = any(difficulty_list))
      and (
        not (filters ? 'tags')
        or tags && array(select jsonb_array_elements_text(filters->'tags'))
      )
      and (
        owner_scope is null
        or owner_scope = 'all'
        or (
            owner_scope = 'platform'
            and owner_type = 'platform'
        )
        or (
            owner_scope = 'institution'
            and owner_type = 'institution'
            and (
              allowed_owner_ids is null
              or owner_id = any(allowed_owner_ids)
            )
        )
        or (
            owner_scope = 'teacher'
            and owner_type = 'teacher'
            and (
              allowed_owner_ids is null
              or owner_id = any(allowed_owner_ids)
            )
        )
      )
    order by random()
    limit limit_value;
end;
$$;
