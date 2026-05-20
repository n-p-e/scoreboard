--
-- PostgreSQL database dump
--

\restrict nhEHObchZv7qh9xSad0a6iuNh2r9We7oaIczhXaw9gBsKpxG8gzWZAUkqiqQEBB

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Homebrew)

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

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: leagues; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.leagues (
    id bigint NOT NULL,
    league_id character varying NOT NULL,
    display_name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    status text
);


ALTER TABLE public.leagues OWNER TO scoreboard;

--
-- Name: leagues_id_seq; Type: SEQUENCE; Schema: public; Owner: scoreboard
--

ALTER TABLE public.leagues ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.leagues_id_seq
    START WITH 10000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ops_history; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.ops_history (
    id uuid NOT NULL,
    source_user uuid,
    action character varying NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.ops_history OWNER TO scoreboard;

--
-- Name: players; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.players (
    id bigint NOT NULL,
    name character varying NOT NULL,
    last_active timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    name_lower character varying NOT NULL,
    user_id uuid
);


ALTER TABLE public.players OWNER TO scoreboard;

--
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: scoreboard
--

ALTER TABLE public.players ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.players_id_seq
    START WITH 10000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: standings; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.standings (
    id bigint NOT NULL,
    league_id character varying NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    confirmed_at timestamp without time zone
);


ALTER TABLE public.standings OWNER TO scoreboard;

--
-- Name: standings_id_seq; Type: SEQUENCE; Schema: public; Owner: scoreboard
--

ALTER TABLE public.standings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.standings_id_seq
    START WITH 10000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: standings_items; Type: VIEW; Schema: public; Owner: scoreboard
--

CREATE VIEW public.standings_items AS
 SELECT standings.league_id,
    standings.created_at,
    standings.updated_at,
    (player_data.value ->> 'name'::text) AS player_name,
    COALESCE((player_data.value ->> 'nameLower'::text), lower((player_data.value ->> 'name'::text))) AS player_name_lower,
    ((player_data.value ->> 'points'::text))::integer AS points,
    ((player_data.value ->> 'umaPoints'::text))::integer AS uma_points,
    ((player_data.value ->> 'finalScore'::text))::integer AS final_score,
    ((player_data.value ->> 'rank'::text))::integer AS rank
   FROM (public.standings
     CROSS JOIN LATERAL jsonb_array_elements((standings.data -> 'standings'::text)) player_data(value))
  WHERE (standings.deleted_at IS NULL);


ALTER VIEW public.standings_items OWNER TO scoreboard;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role character varying NOT NULL
);


ALTER TABLE public.user_roles OWNER TO scoreboard;

--
-- Name: users; Type: TABLE; Schema: public; Owner: scoreboard
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying NOT NULL,
    password_hash character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO scoreboard;

--
-- Name: leagues leagues_display_name_unique; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_display_name_unique UNIQUE (display_name);


--
-- Name: leagues leagues_league_id_unique; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_league_id_unique UNIQUE (league_id);


--
-- Name: leagues leagues_pkey; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_pkey PRIMARY KEY (id);


--
-- Name: ops_history ops_history_pkey; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.ops_history
    ADD CONSTRAINT ops_history_pkey PRIMARY KEY (id);


--
-- Name: players players_name_lower_unique; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_name_lower_unique UNIQUE (name_lower);


--
-- Name: players players_name_unique; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_name_unique UNIQUE (name);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: standings standings_pkey; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_pk; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_pk PRIMARY KEY (user_id, role);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: players_name_lower_search_idx; Type: INDEX; Schema: public; Owner: scoreboard
--

CREATE INDEX players_name_lower_search_idx ON public.players USING gist (name_lower public.gist_trgm_ops);


--
-- Name: ops_history ops_history_source_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.ops_history
    ADD CONSTRAINT ops_history_source_user_fkey FOREIGN KEY (source_user) REFERENCES public.users(id);


--
-- Name: players players_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: standings standings_league_id_leagues_league_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scoreboard
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_league_id_leagues_league_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(league_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nhEHObchZv7qh9xSad0a6iuNh2r9We7oaIczhXaw9gBsKpxG8gzWZAUkqiqQEBB
