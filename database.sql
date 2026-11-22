--
-- PostgreSQL database dump
--

\restrict 8vYNZG5zad0RO5Tc7PIMf3bZiMvTN8MJd8hY8KCRo1JWiNHfOfKAZGqCUzXfx5C

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-11-11 23:53:20

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16480)
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos (
    id bigint NOT NULL,
    visitante text NOT NULL,
    usuario_nombre text,
    negocio_id integer NOT NULL,
    tipo text NOT NULL,
    producto text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    duracion_segundos integer DEFAULT 0 NOT NULL,
    CONSTRAINT eventos_tipo_check CHECK ((tipo = ANY (ARRAY['ficha'::text, 'carrito'::text, 'producto'::text, 'busqueda'::text, 'categoria'::text, 'tiempo'::text])))
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16479)
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_id_seq OWNER TO postgres;

--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 227
-- Name: eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_id_seq OWNED BY public.eventos.id;


--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: negocios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.negocios (
    id integer NOT NULL,
    slug text NOT NULL,
    nombre text NOT NULL,
    categoria text NOT NULL,
    ciudad text NOT NULL,
    nivel text DEFAULT 'Nuevo'::text NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT negocios_nivel_check CHECK ((nivel = ANY (ARRAY['Nuevo'::text, 'Datos verificados'::text, 'Con historial'::text])))
);


ALTER TABLE public.negocios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: negocios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.negocios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.negocios_id_seq OWNER TO postgres;

--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 219
-- Name: negocios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.negocios_id_seq OWNED BY public.negocios.id;


--
-- TOC entry 222 (class 1259 OID 16411)
-- Name: opiniones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opiniones (
    id integer NOT NULL,
    negocio_id integer NOT NULL,
    nombre text NOT NULL,
    puntos smallint NOT NULL,
    compra_confirmada boolean DEFAULT false NOT NULL,
    comentario text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT opiniones_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text]))),
    CONSTRAINT opiniones_puntos_check CHECK (((puntos >= 0) AND (puntos <= 5)))
);


ALTER TABLE public.opiniones OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16410)
-- Name: opiniones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opiniones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opiniones_id_seq OWNER TO postgres;

--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 221
-- Name: opiniones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opiniones_id_seq OWNED BY public.opiniones.id;


--
-- TOC entry 224 (class 1259 OID 16438)
-- Name: reportes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportes (
    id integer NOT NULL,
    negocio_id integer,
    motivo text NOT NULL,
    detalle text NOT NULL,
    estado text DEFAULT 'nuevo'::text NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reportes_estado_check CHECK ((estado = ANY (ARRAY['nuevo'::text, 'en revisión'::text, 'cerrado'::text])))
);


ALTER TABLE public.reportes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16437)
-- Name: reportes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportes_id_seq OWNER TO postgres;

--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 223
-- Name: reportes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportes_id_seq OWNED BY public.reportes.id;


--
-- TOC entry 226 (class 1259 OID 16460)
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes (
    id integer NOT NULL,
    nombre text NOT NULL,
    tienda text NOT NULL,
    correo text NOT NULL,
    whatsapp text NOT NULL,
    productos text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT solicitudes_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text])))
);


ALTER TABLE public.solicitudes OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16459)
-- Name: solicitudes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_id_seq OWNER TO postgres;

--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 225
-- Name: solicitudes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_id_seq OWNED BY public.solicitudes.id;


--
-- TOC entry 4889 (class 2604 OID 16483)
-- Name: eventos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id SET DEFAULT nextval('public.eventos_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 16393)
-- Name: negocios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.negocios ALTER COLUMN id SET DEFAULT nextval('public.negocios_id_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 16414)
-- Name: opiniones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opiniones ALTER COLUMN id SET DEFAULT nextval('public.opiniones_id_seq'::regclass);


--
-- TOC entry 4883 (class 2604 OID 16441)
-- Name: reportes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes ALTER COLUMN id SET DEFAULT nextval('public.reportes_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 16463)
-- Name: solicitudes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_id_seq'::regclass);


--
-- TOC entry 5070 (class 0 OID 16480)
-- Dependencies: 228
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos (id, visitante, negocio_id, tipo, producto, creado_en) FROM stdin;
1	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:26:26.676385-05
2	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatillas Masculinas	2026-11-11 23:26:28.415635-05
3	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatillas Masculinas	2026-11-11 23:26:29.243141-05
4	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatilla Femenina Ligera	2026-11-11 23:26:30.323257-05
5	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:26:39.768989-05
6	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:41.712514-05
7	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Mantenimientos	2026-11-11 23:26:42.172286-05
8	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:42.542694-05
9	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:43.833147-05
10	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:44.06183-05
11	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:44.261872-05
12	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	carrito	Reparaciones de dispositivos	2026-11-11 23:26:44.412587-05
13	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:27:32.390863-05
14	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:28:16.891683-05
15	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:29:30.731911-05
16	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:29:39.294592-05
17	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatilla Femenina Ligera	2026-11-11 23:29:40.851003-05
18	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatillas Masculinas	2026-11-11 23:29:41.201068-05
19	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatilla Femenina Ligera	2026-11-11 23:29:41.490409-05
20	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatillas Masculinas	2026-11-11 23:29:41.701809-05
21	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatilla Femenina Ligera	2026-11-11 23:29:41.921189-05
22	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	carrito	Zapatilla Femenina Ligera	2026-11-11 23:29:42.27047-05
23	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	ficha	\N	2026-11-11 23:29:49.839628-05
24	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para bodas	2026-11-11 23:29:51.911585-05
25	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:29:52.209746-05
26	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para bodas	2026-11-11 23:29:52.481438-05
27	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:29:52.710568-05
28	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para bodas	2026-11-11 23:29:52.920586-05
29	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:29:53.084149-05
30	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	ficha	\N	2026-11-11 23:29:58.722451-05
31	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para bodas	2026-11-11 23:30:00.39048-05
32	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:00.771858-05
33	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:00.920378-05
34	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.070457-05
35	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.209712-05
36	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.34976-05
37	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.490254-05
38	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.619997-05
39	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.749869-05
40	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.860095-05
41	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:01.989885-05
42	7b15cca2-c69b-40f5-9070-2fe16b5a043c	2	carrito	Decoración para habitaciones	2026-11-11 23:30:02.133631-05
43	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:30:52.181047-05
44	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:05.192946-05
45	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:23.413936-05
46	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:28.619848-05
47	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:33.099559-05
48	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:37.77619-05
49	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:42.708238-05
50	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:47.996195-05
51	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:52.842041-05
52	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:31:57.411058-05
53	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:32:08.259362-05
54	7b15cca2-c69b-40f5-9070-2fe16b5a043c	3	ficha	\N	2026-11-11 23:32:15.644355-05
55	7b15cca2-c69b-40f5-9070-2fe16b5a043c	1	ficha	\N	2026-11-11 23:32:22.489079-05
\.


--
-- TOC entry 5062 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: negocios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.negocios (id, slug, nombre, categoria, ciudad, nivel, creado_en) FROM stdin;
1	calzado-urbano-pe	Calzado Urbano PE	Calzado y Moda	Cajamarca	Datos verificados	2026-11-09 21:45:56.279287-05
2	eco-hogar	Eco Hogar	Artículos del Hogar	Arequipa	Datos verificados	2026-11-09 21:45:56.279287-05
3	tech-soluciones	Tech Soluciones	Tecnología	Carabayllo	Nuevo	2026-11-09 21:45:56.279287-05
\.


--
-- TOC entry 5064 (class 0 OID 16411)
-- Dependencies: 222
-- Data for Name: opiniones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opiniones (id, negocio_id, nombre, puntos, compra_confirmada, comentario, estado, creado_en) FROM stdin;
1	1	Luis R.	4	t	Buen producto. El envío tardó un día más de lo acordado.	aprobada	2026-11-09 22:06:31.068758-05
2	1	María P.	5	t	El producto llegó tal como en las fotos.	aprobada	2026-11-09 22:06:31.068758-05
3	2	Thvlin S.	4	t	Hermosa decoración.	aprobada	2026-11-09 22:06:31.068758-05
4	2	Ronald Z.	5	t	Me respondió rápido y la decoración quedó preciosa.	aprobada	2026-11-09 22:06:31.068758-05
5	3	Andres S.	4	t	Buena atención.	aprobada	2026-11-09 22:06:31.068758-05
6	3	Sebasthian R.	5	t	Me arregló bien mi celular.	aprobada	2026-11-09 22:06:31.068758-05
12	3	aaaaaa	5	t	xd huevon	pendiente	2026-11-11 23:28:37.625005-05
\.


--
-- TOC entry 5066 (class 0 OID 16438)
-- Dependencies: 224
-- Data for Name: reportes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportes (id, negocio_id, motivo, detalle, estado, creado_en) FROM stdin;
1	1	Pedí un pago y no entregó	no me llego	cerrado	2026-11-11 15:36:43.491282-05
\.


--
-- TOC entry 5068 (class 0 OID 16460)
-- Dependencies: 226
-- Data for Name: solicitudes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes (id, nombre, tienda, correo, whatsapp, productos, estado, creado_en) FROM stdin;
2	sdgsgsd	sdfsd	sdfsd@gmail.com	537678524	rhdfgdfg	pendiente	2026-11-09 22:29:59.09199-05
1	sdffsdfs	sdfsdfs	sdfsdf@gmail.com	9555753445	sdgsgs	pendiente	2026-11-09 22:27:33.167995-05
\.


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 227
-- Name: eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_id_seq', 55, true);


--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 219
-- Name: negocios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.negocios_id_seq', 3, true);


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 221
-- Name: opiniones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opiniones_id_seq', 12, true);


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 223
-- Name: reportes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportes_id_seq', 1, true);


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 225
-- Name: solicitudes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_id_seq', 2, true);


--
-- TOC entry 4909 (class 2606 OID 16494)
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 16407)
-- Name: negocios negocios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.negocios
    ADD CONSTRAINT negocios_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 16409)
-- Name: negocios negocios_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.negocios
    ADD CONSTRAINT negocios_slug_key UNIQUE (slug);


--
-- TOC entry 4902 (class 2606 OID 16431)
-- Name: opiniones opiniones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opiniones
    ADD CONSTRAINT opiniones_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 16453)
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- TOC entry 4906 (class 2606 OID 16478)
-- Name: solicitudes solicitudes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 1259 OID 16501)
-- Name: eventos_negocio_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_negocio_idx ON public.eventos USING btree (negocio_id);


--
-- TOC entry 4910 (class 1259 OID 16500)
-- Name: eventos_visitante_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_visitante_idx ON public.eventos USING btree (visitante);


--
-- TOC entry 4913 (class 2606 OID 16495)
-- Name: eventos eventos_negocio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 16432)
-- Name: opiniones opiniones_negocio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opiniones
    ADD CONSTRAINT opiniones_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 16454)
-- Name: reportes reportes_negocio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id) ON DELETE SET NULL;


-- Completed on 2026-11-11 23:53:20

--
-- PostgreSQL database dump complete
--

\unrestrict 8vYNZG5zad0RO5Tc7PIMf3bZiMvTN8MJd8hY8KCRo1JWiNHfOfKAZGqCUzXfx5C

