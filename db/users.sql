CREATE TABLE users (
  id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL PRIMARY KEY,
  username character varying(50) NOT NULL,
  password character varying(255) NOT NULL,
  role character varying(20) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  shift_group character varying(2)
);