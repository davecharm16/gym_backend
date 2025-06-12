-- DROP CHILD TABLES FIRST TO AVOID FK CONFLICTS
drop table if exists payments cascade;
drop table if exists enrollments cascade;
drop table if exists trainings cascade;
drop table if exists categories cascade;
drop table if exists admins cascade;
drop table if exists instructors cascade;
drop table if exists students cascade;

-- 1. STUDENTS TABLE
create table students (
  id uuid primary key references users(id) on delete cascade,
  full_name text not null,
  membership_type text check (membership_type in ('monthly', 'per_session')) not null,
  subscription_active boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. INSTRUCTORS TABLE
create table instructors (
  id uuid primary key references users(id) on delete cascade,
  full_name text not null,
  bio text,
  created_at timestamp with time zone default now()
);

-- 3. ADMINS TABLE
create table admins (
  id uuid primary key references users(id) on delete cascade,
  full_name text,
  super_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. CATEGORIES TABLE
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- 5. TRAININGS TABLE
create table trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  instructor_id uuid references instructors(id) on delete set null,
  base_fee numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- 6. ENROLLMENTS TABLE
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  training_id uuid not null references trainings(id) on delete cascade,
  enrolled_at timestamp with time zone default now(),
  paid boolean default false,
  unique(student_id, training_id)
);

-- 7. PAYMENTS TABLE
create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(10, 2) not null,
  payment_type text check (payment_type in ('subscription', 'training_fee')) not null,
  training_id uuid references trainings(id) on delete set null,
  paid_at timestamp with time zone default now()
);
