CREATE TABLE flakes_detail (
  id integer DEFAULT nextval('flakes_detail_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  tebal numeric NOT NULL,
  jumlah integer DEFAULT 0,
  total_ketebalan numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES flakes_documents(id)
);