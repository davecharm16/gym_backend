-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS student_checkins CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin', 'student', 'instructor'])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ADMINS (references users.id)
CREATE TABLE public.admins (
  id uuid PRIMARY KEY, -- Must match users.id
  full_name text,
  super_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- INSTRUCTORS (references users.id)
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- STUDENTS (references users.id)
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  sex text NOT NULL CHECK (sex = ANY (ARRAY['male', 'female', 'other'])),
  address text NOT NULL,
  birthdate date NOT NULL,
  enrollment_date date NOT NULL,
  subscription_type text NOT NULL CHECK (subscription_type = ANY (ARRAY['monthly', 'per_session'])),
  picture_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- TRAININGS (references instructors and categories)
CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  instructor_id uuid REFERENCES public.instructors(id),
  base_fee numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ENROLLMENTS (links students to trainings)
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  enrolled_at timestamp with time zone DEFAULT now(),
  paid boolean DEFAULT false
);

-- PAYMENTS (for subscription or training fee)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['subscription', 'training_fee'])),
  training_id uuid REFERENCES public.trainings(id),
  paid_at timestamp with time zone DEFAULT now()
);

-- STUDENT CHECKINS (attendance tracking)
CREATE TABLE public.student_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  checkin_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
