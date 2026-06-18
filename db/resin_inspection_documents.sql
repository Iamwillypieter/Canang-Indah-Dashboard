CREATE TABLE resin_inspection_documents (
  id integer DEFAULT nextval('resin_inspection_documents_id_seq'::regclass) NOT NULL PRIMARY KEY,
  title character varying(255),
  date date,
  shift text,
  group_name text,
  comment_by character varying(255),
  created_by text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status character varying(20) DEFAULT 'draft'::character varying,
  submitted_at timestamp without time zone,
  tag_name character varying(255),
  updated_at timestamp without time zone DEFAULT now()
);