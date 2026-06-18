CREATE TABLE qc_analisa_documents (
  id integer DEFAULT nextval('qc_analisa_documents_id_seq'::regclass) NOT NULL PRIMARY KEY,
  title character varying(200),
  tanggal date NOT NULL,
  shift_group character varying(50) NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  status character varying(20) DEFAULT 'draft'::character varying,
  submitted_at timestamp without time zone,
  tag_name character varying(50),
  updated_at timestamp without time zone DEFAULT now()
);