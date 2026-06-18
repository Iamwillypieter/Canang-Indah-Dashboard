CREATE TABLE flakes_documents (
  id integer DEFAULT nextval('flakes_documents_id_seq'::regclass) NOT NULL PRIMARY KEY,
  title character varying(255) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status character varying(20) DEFAULT 'draft'::character varying,
  submitted_at timestamp without time zone,
  tag_name character varying(50)
);