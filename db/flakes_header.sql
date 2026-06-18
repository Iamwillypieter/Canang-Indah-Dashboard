CREATE TABLE flakes_header (
  id integer DEFAULT nextval('flakes_header_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  tanggal date NOT NULL,
  jam time without time zone,
  shift character varying(50),
  ukuran_papan character varying(100),
  group character varying(100),
  jarak_pisau numeric,
  keterangan text,
  pemeriksa character varying(100),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT now(),
  FOREIGN KEY (document_id) REFERENCES flakes_documents(id)
);