--
-- PostgreSQL database dump
--

\restrict B3x3uMAxfz53AjQGchuLRCZK9D2m5dqhZHyvy6jMU3kwOQdVUzaMbdQhDkapGrJ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    admin_id integer NOT NULL,
    name character varying(45) NOT NULL,
    email character varying(45) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_admin_id_seq OWNER TO postgres;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_admin_id_seq OWNED BY public.admin.admin_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    target_role character varying(45) DEFAULT 'all'::character varying,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL,
    CONSTRAINT categories_target_role_check CHECK (((target_role)::text = ANY ((ARRAY['student'::character varying, 'teacher'::character varying, 'all'::character varying])::text[])))
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_category_id_seq OWNER TO postgres;

--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: diary_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diary_entries (
    entry_id integer NOT NULL,
    user_id integer,
    mood character varying(45),
    mood_score integer DEFAULT 5,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT diary_entries_mood_score_check CHECK (((mood_score >= 1) AND (mood_score <= 10)))
);


ALTER TABLE public.diary_entries OWNER TO postgres;

--
-- Name: diary_entries_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.diary_entries_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.diary_entries_entry_id_seq OWNER TO postgres;

--
-- Name: diary_entries_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.diary_entries_entry_id_seq OWNED BY public.diary_entries.entry_id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(255) NOT NULL,
    kind character varying(16) DEFAULT 'solo'::character varying NOT NULL,
    filter_cat character varying(32) DEFAULT 'other'::character varying NOT NULL,
    category_label character varying(120) DEFAULT ''::character varying NOT NULL,
    price_key character varying(80) DEFAULT 'eventsEvPriceFrom2000'::character varying NOT NULL,
    tf_loc character varying(24) DEFAULT 'almaty'::character varying NOT NULL,
    tf_date character varying(24) DEFAULT 'this_month'::character varying NOT NULL,
    tf_time character varying(24) DEFAULT 'evening'::character varying NOT NULL,
    tf_mood character varying(24) DEFAULT 'calm'::character varying NOT NULL,
    card_tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    hero_url text DEFAULT ''::text NOT NULL,
    ticket_url text DEFAULT ''::text NOT NULL,
    venue_line text DEFAULT ''::text NOT NULL,
    teaser text DEFAULT ''::text NOT NULL,
    about_text text DEFAULT ''::text NOT NULL,
    duration_label character varying(64) DEFAULT ''::character varying NOT NULL,
    age_label character varying(64) DEFAULT ''::character varying NOT NULL,
    genre_label character varying(120) DEFAULT ''::character varying NOT NULL,
    refund_label character varying(120) DEFAULT ''::character varying NOT NULL,
    venue_image_url text DEFAULT ''::text NOT NULL,
    venue_pin_text text DEFAULT ''::text NOT NULL,
    organizer_name character varying(180) DEFAULT ''::character varying NOT NULL,
    organizer_desc text DEFAULT ''::text NOT NULL,
    suit_tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    important_notes jsonb DEFAULT '[]'::jsonb NOT NULL,
    gallery_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL,
    price_label character varying(80) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: film_collection_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.film_collection_items (
    collection_id integer NOT NULL,
    film_id integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.film_collection_items OWNER TO postgres;

--
-- Name: film_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.film_collections (
    collection_id integer NOT NULL,
    slug character varying(64) NOT NULL,
    title character varying(120) DEFAULT ''::character varying NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.film_collections OWNER TO postgres;

--
-- Name: film_collections_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.film_collections_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.film_collections_collection_id_seq OWNER TO postgres;

--
-- Name: film_collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.film_collections_collection_id_seq OWNED BY public.film_collections.collection_id;


--
-- Name: films; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.films (
    film_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description_short text DEFAULT ''::text NOT NULL,
    description_full text DEFAULT ''::text NOT NULL,
    watch_url text NOT NULL,
    poster_url text DEFAULT ''::text NOT NULL,
    gallery_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags jsonb DEFAULT '{}'::jsonb NOT NULL,
    source character varying(180) DEFAULT ''::character varying,
    duration character varying(32) DEFAULT ''::character varying,
    year character varying(16) DEFAULT ''::character varying,
    rating character varying(16) DEFAULT ''::character varying,
    category_id character varying(40) DEFAULT 'burnout'::character varying,
    psych_tag character varying(48) DEFAULT 'light'::character varying,
    genres_display character varying(255) DEFAULT ''::character varying,
    embed_url text DEFAULT ''::text,
    director character varying(255) DEFAULT ''::character varying,
    screenwriter character varying(255) DEFAULT ''::character varying,
    country character varying(255) DEFAULT ''::character varying,
    quote text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
);


ALTER TABLE public.films OWNER TO postgres;

--
-- Name: films_film_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.films_film_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.films_film_id_seq OWNER TO postgres;

--
-- Name: films_film_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.films_film_id_seq OWNED BY public.films.film_id;


--
-- Name: meditations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meditations (
    meditation_id integer NOT NULL,
    title character varying(255) NOT NULL,
    kind character varying(16) DEFAULT 'meditation'::character varying NOT NULL,
    topics jsonb DEFAULT '[]'::jsonb NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    description_short text DEFAULT ''::text NOT NULL,
    duration_min integer DEFAULT 10 NOT NULL,
    practice_focus character varying(120) DEFAULT ''::character varying NOT NULL,
    difficulty_level character varying(32) DEFAULT 'beginner'::character varying NOT NULL,
    tip_before text DEFAULT ''::text NOT NULL,
    audio_source character varying(16) DEFAULT 'youtube'::character varying NOT NULL,
    audio_file_url text DEFAULT ''::text NOT NULL,
    audio_external_url text DEFAULT ''::text NOT NULL,
    youtube_embed_url text DEFAULT ''::text NOT NULL,
    youtube_video_id character varying(48) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
);


ALTER TABLE public.meditations OWNER TO postgres;

--
-- Name: meditations_meditation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meditations_meditation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meditations_meditation_id_seq OWNER TO postgres;

--
-- Name: meditations_meditation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meditations_meditation_id_seq OWNED BY public.meditations.meditation_id;


--
-- Name: music_collection_tracks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.music_collection_tracks (
    collection_id integer NOT NULL,
    music_id integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.music_collection_tracks OWNER TO postgres;

--
-- Name: music_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.music_collections (
    collection_id integer NOT NULL,
    slug character varying(48) NOT NULL,
    label_key character varying(64) DEFAULT ''::character varying NOT NULL,
    mood character varying(32) DEFAULT 'calm_down'::character varying NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    title character varying(120) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.music_collections OWNER TO postgres;

--
-- Name: music_collections_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.music_collections_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_collections_collection_id_seq OWNER TO postgres;

--
-- Name: music_collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.music_collections_collection_id_seq OWNED BY public.music_collections.collection_id;


--
-- Name: music_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.music_items (
    music_id integer NOT NULL,
    kind character varying(16) DEFAULT 'track'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    artist character varying(180) DEFAULT ''::character varying NOT NULL,
    mood character varying(32) DEFAULT 'calm'::character varying NOT NULL,
    genre_label character varying(120) DEFAULT ''::character varying NOT NULL,
    description_short text DEFAULT ''::text NOT NULL,
    duration_min integer DEFAULT 3 NOT NULL,
    duration_display character varying(16) DEFAULT '3:00'::character varying NOT NULL,
    icon_name character varying(32) DEFAULT 'Music2'::character varying NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    audio_source character varying(16) DEFAULT 'youtube'::character varying NOT NULL,
    audio_file_url text DEFAULT ''::text NOT NULL,
    audio_external_url text DEFAULT ''::text NOT NULL,
    youtube_embed_url text DEFAULT ''::text NOT NULL,
    youtube_video_id character varying(48) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL,
    is_featured_pick boolean DEFAULT false NOT NULL
);


ALTER TABLE public.music_items OWNER TO postgres;

--
-- Name: music_items_music_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.music_items_music_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_items_music_id_seq OWNER TO postgres;

--
-- Name: music_items_music_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.music_items_music_id_seq OWNED BY public.music_items.music_id;


--
-- Name: podcast_episodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.podcast_episodes (
    podcast_id integer NOT NULL,
    title character varying(255) NOT NULL,
    show_name character varying(180) DEFAULT ''::character varying NOT NULL,
    description_short text DEFAULT ''::text NOT NULL,
    meta_line character varying(255) DEFAULT ''::character varying NOT NULL,
    topic character varying(32) DEFAULT 'psych'::character varying NOT NULL,
    episode_num integer DEFAULT 1 NOT NULL,
    duration_min integer DEFAULT 24 NOT NULL,
    duration_display character varying(16) DEFAULT '24:00'::character varying NOT NULL,
    is_featured_pick boolean DEFAULT false NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    audio_source character varying(16) DEFAULT 'youtube'::character varying NOT NULL,
    audio_file_url text DEFAULT ''::text NOT NULL,
    audio_external_url text DEFAULT ''::text NOT NULL,
    youtube_embed_url text DEFAULT ''::text NOT NULL,
    youtube_video_id character varying(48) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tags jsonb DEFAULT '{}'::jsonb NOT NULL,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
);


ALTER TABLE public.podcast_episodes OWNER TO postgres;

--
-- Name: podcast_episodes_podcast_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.podcast_episodes_podcast_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.podcast_episodes_podcast_id_seq OWNER TO postgres;

--
-- Name: podcast_episodes_podcast_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.podcast_episodes_podcast_id_seq OWNED BY public.podcast_episodes.podcast_id;


--
-- Name: practice_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.practice_favorites (
    user_id integer NOT NULL,
    practice_key character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.practice_favorites OWNER TO postgres;

--
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.practice_sessions (
    session_id integer NOT NULL,
    user_id integer,
    practice_key character varying(64) NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.practice_sessions OWNER TO postgres;

--
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.practice_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.practice_sessions_session_id_seq OWNER TO postgres;

--
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.practice_sessions_session_id_seq OWNED BY public.practice_sessions.session_id;


--
-- Name: psychologist_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.psychologist_documents (
    document_id integer NOT NULL,
    user_id integer NOT NULL,
    file_path text NOT NULL,
    original_name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.psychologist_documents OWNER TO postgres;

--
-- Name: psychologist_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.psychologist_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.psychologist_documents_document_id_seq OWNER TO postgres;

--
-- Name: psychologist_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.psychologist_documents_document_id_seq OWNED BY public.psychologist_documents.document_id;


--
-- Name: psychologist_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.psychologist_invitations (
    invitation_id integer NOT NULL,
    token character varying(128) NOT NULL,
    email character varying(254) NOT NULL,
    invite_name character varying(120) NOT NULL,
    work_phone character varying(40),
    organization character varying(200),
    specialist_level character varying(120),
    invited_by integer,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    used_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.psychologist_invitations OWNER TO postgres;

--
-- Name: psychologist_invitations_invitation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.psychologist_invitations_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.psychologist_invitations_invitation_id_seq OWNER TO postgres;

--
-- Name: psychologist_invitations_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.psychologist_invitations_invitation_id_seq OWNED BY public.psychologist_invitations.invitation_id;


--
-- Name: psychologist_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.psychologist_profiles (
    user_id integer NOT NULL,
    account_status character varying(32) DEFAULT 'pending_review'::character varying NOT NULL,
    organization character varying(200),
    specialist_level character varying(120),
    work_phone character varying(40),
    whatsapp character varying(40),
    education text,
    specialization character varying(200),
    experience_years integer,
    bio text,
    invited_by integer,
    invitation_id integer,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT psychologist_profiles_account_status_check CHECK (((account_status)::text = ANY ((ARRAY['pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'blocked'::character varying])::text[])))
);


ALTER TABLE public.psychologist_profiles OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    question_id integer NOT NULL,
    test_id integer,
    question_text character varying(255) NOT NULL,
    options jsonb,
    order_num integer DEFAULT 0
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_question_id_seq OWNER TO postgres;

--
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_question_id_seq OWNED BY public.questions.question_id;


--
-- Name: reading_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reading_items (
    reading_id integer NOT NULL,
    kind character varying(16) DEFAULT 'article'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(32) DEFAULT 'burnout'::character varying NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    description_short text DEFAULT ''::text NOT NULL,
    body_full text DEFAULT ''::text NOT NULL,
    read_url text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
);


ALTER TABLE public.reading_items OWNER TO postgres;

--
-- Name: reading_items_reading_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reading_items_reading_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reading_items_reading_id_seq OWNER TO postgres;

--
-- Name: reading_items_reading_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reading_items_reading_id_seq OWNED BY public.reading_items.reading_id;


--
-- Name: support_request_confirmations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_request_confirmations (
    confirmation_id integer NOT NULL,
    request_id integer NOT NULL,
    milestone character varying(40) NOT NULL,
    psychologist_id integer NOT NULL,
    user_confirmed boolean,
    notification_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp without time zone
);


ALTER TABLE public.support_request_confirmations OWNER TO postgres;

--
-- Name: support_request_confirmations_confirmation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_request_confirmations_confirmation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_request_confirmations_confirmation_id_seq OWNER TO postgres;

--
-- Name: support_request_confirmations_confirmation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_request_confirmations_confirmation_id_seq OWNED BY public.support_request_confirmations.confirmation_id;


--
-- Name: support_request_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_request_notes (
    note_id integer NOT NULL,
    request_id integer NOT NULL,
    psychologist_id integer NOT NULL,
    body text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.support_request_notes OWNER TO postgres;

--
-- Name: support_request_notes_note_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_request_notes_note_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_request_notes_note_id_seq OWNER TO postgres;

--
-- Name: support_request_notes_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_request_notes_note_id_seq OWNED BY public.support_request_notes.note_id;


--
-- Name: support_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_requests (
    request_id integer NOT NULL,
    user_id integer NOT NULL,
    display_name character varying(120) NOT NULL,
    contact character varying(254) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(32) DEFAULT 'new'::character varying NOT NULL,
    assigned_psychologist_id integer,
    assigned_at timestamp without time zone,
    assigned_by integer,
    whatsapp character varying(40),
    CONSTRAINT support_requests_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'contacted'::character varying, 'online_consultation'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.support_requests OWNER TO postgres;

--
-- Name: support_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_requests_request_id_seq OWNER TO postgres;

--
-- Name: support_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_requests_request_id_seq OWNED BY public.support_requests.request_id;


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_results (
    result_id integer NOT NULL,
    user_id integer,
    test_id integer,
    score integer NOT NULL,
    level character varying(45),
    answers jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.test_results OWNER TO postgres;

--
-- Name: test_results_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_results_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_results_result_id_seq OWNER TO postgres;

--
-- Name: test_results_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_results_result_id_seq OWNED BY public.test_results.result_id;


--
-- Name: tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tests (
    test_id integer NOT NULL,
    title character varying(100) NOT NULL,
    description character varying(255),
    category_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    scoring_type character varying(40) DEFAULT 'likert_sum'::character varying,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
);


ALTER TABLE public.tests OWNER TO postgres;

--
-- Name: tests_test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tests_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tests_test_id_seq OWNER TO postgres;

--
-- Name: tests_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tests_test_id_seq OWNED BY public.tests.test_id;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(80) DEFAULT 'system'::character varying NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    payload jsonb,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notifications_notification_id_seq OWNER TO postgres;

--
-- Name: user_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_notifications_notification_id_seq OWNED BY public.user_notifications.notification_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(120) NOT NULL,
    age integer,
    email character varying(254) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(45) DEFAULT 'student'::character varying NOT NULL,
    avatar text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    onboarding_burnout_completed boolean DEFAULT false,
    onboarding_burnout_percent integer,
    onboarding_burnout_completed_at timestamp without time zone,
    daily_personalization_json jsonb,
    gender character varying(20),
    space_preferences jsonb,
    has_completed_space_onboarding boolean DEFAULT false,
    notifications_enabled boolean DEFAULT true,
    last_name character varying(120),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'teacher'::character varying, 'admin'::character varying, 'psychologist'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: admin admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_admin_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: diary_entries entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diary_entries ALTER COLUMN entry_id SET DEFAULT nextval('public.diary_entries_entry_id_seq'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: film_collections collection_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collections ALTER COLUMN collection_id SET DEFAULT nextval('public.film_collections_collection_id_seq'::regclass);


--
-- Name: films film_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.films ALTER COLUMN film_id SET DEFAULT nextval('public.films_film_id_seq'::regclass);


--
-- Name: meditations meditation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meditations ALTER COLUMN meditation_id SET DEFAULT nextval('public.meditations_meditation_id_seq'::regclass);


--
-- Name: music_collections collection_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collections ALTER COLUMN collection_id SET DEFAULT nextval('public.music_collections_collection_id_seq'::regclass);


--
-- Name: music_items music_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_items ALTER COLUMN music_id SET DEFAULT nextval('public.music_items_music_id_seq'::regclass);


--
-- Name: podcast_episodes podcast_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_episodes ALTER COLUMN podcast_id SET DEFAULT nextval('public.podcast_episodes_podcast_id_seq'::regclass);


--
-- Name: practice_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.practice_sessions_session_id_seq'::regclass);


--
-- Name: psychologist_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_documents ALTER COLUMN document_id SET DEFAULT nextval('public.psychologist_documents_document_id_seq'::regclass);


--
-- Name: psychologist_invitations invitation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_invitations ALTER COLUMN invitation_id SET DEFAULT nextval('public.psychologist_invitations_invitation_id_seq'::regclass);


--
-- Name: questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN question_id SET DEFAULT nextval('public.questions_question_id_seq'::regclass);


--
-- Name: reading_items reading_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_items ALTER COLUMN reading_id SET DEFAULT nextval('public.reading_items_reading_id_seq'::regclass);


--
-- Name: support_request_confirmations confirmation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations ALTER COLUMN confirmation_id SET DEFAULT nextval('public.support_request_confirmations_confirmation_id_seq'::regclass);


--
-- Name: support_request_notes note_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_notes ALTER COLUMN note_id SET DEFAULT nextval('public.support_request_notes_note_id_seq'::regclass);


--
-- Name: support_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_requests ALTER COLUMN request_id SET DEFAULT nextval('public.support_requests_request_id_seq'::regclass);


--
-- Name: test_results result_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results ALTER COLUMN result_id SET DEFAULT nextval('public.test_results_result_id_seq'::regclass);


--
-- Name: tests test_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests ALTER COLUMN test_id SET DEFAULT nextval('public.tests_test_id_seq'::regclass);


--
-- Name: user_notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.user_notifications_notification_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (admin_id, name, email, password, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (category_id, name, description, target_role, target_gender) FROM stdin;
1	Базовые тесты	Общие тесты для всех пользователей	all	all
2	Для студентов	Тесты на выгорание и учебную нагрузку	student	all
3	Для преподавателей	Профессиональное выгорание и нагрузка	teacher	all
4	Фильмы		all	all
\.


--
-- Data for Name: diary_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diary_entries (entry_id, user_id, mood, mood_score, note, created_at) FROM stdin;
1	9	neutral	4	😴 Мне хочется спать	2026-05-05 21:51:41.918838
2	2	neutral	4	😟 Мне тревожно	2026-05-08 12:33:23.147703
3	2	neutral	4	в Мне тревожно	2026-05-09 01:12:39.088729
4	11	neutral	4	Мне хочется спать	2026-05-09 20:37:06.643543
5	11	neutral	4	Мне тревожно	2026-05-09 20:56:13.395958
6	12	neutral	4	Мне тревожно	2026-05-12 11:57:43.418107
7	12	neutral	4	bjbjbj Мне хочется спать	2026-05-13 15:19:17.316857
8	2	neutral	4	Мне хочется спать	2026-05-26 21:21:43.124385
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood, card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label, age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name, organizer_desc, suit_tags, important_notes, gallery_urls, created_at, updated_at, target_role, target_gender, price_label) FROM stdin;
\.


--
-- Data for Name: film_collection_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.film_collection_items (collection_id, film_id, sort_order) FROM stdin;
2	6	0
2	7	1
2	14	2
2	8	3
2	50	4
2	52	5
3	5	0
3	8	1
3	9	2
3	10	3
3	11	4
3	47	5
\.


--
-- Data for Name: film_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.film_collections (collection_id, slug, title, description, cover_url, sort_order, is_active, updated_at) FROM stdin;
2	тихий-вечер-2	Тихий вечер	Подборка для моментов, когда хочется выдохнуть, замедлиться и побыть в спокойной атмосфере без эмоционального перегруза.\r\nТёплые истории, уютные диалоги, красивые пейзажи и ощущение внутреннего комфорта.	/uploads/film_1779815627414_65q4up1x.jpg	0	t	2026-05-26 22:13:47.577379+05
3	когда-нужен-новый-вдох-3	Когда нужен новый вдох	Фильмы о поиске себя, внутренней свободе, новых ощущениях и возвращении интереса к жизни. Подходит, когда хочется почувствовать мотивацию, вдохновение и немного эмоциональной энергии без давления.	/uploads/film_1779815753848_j3onkbxx.jpg	1	t	2026-05-26 22:15:54.08738+05
\.


--
-- Data for Name: films; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.films (film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags, source, duration, year, rating, category_id, psych_tag, genres_display, embed_url, director, screenwriter, country, quote, created_at, updated_at, target_role, target_gender) FROM stdin;
8	Маленькая мисс Счастье	Добрый, смешной и очень живой фильм.\r\nТёплая история о семье, поддержке и принятии себя, которая помогает отвлечься и почувствовать лёгкость.	Небольшая семья отправляется в путешествие через всю страну, чтобы маленькая Олив смогла поучаствовать в детском конкурсе красоты. По дороге герои сталкиваются с конфликтами, усталостью, странностями друг друга и неожиданно становятся ближе.\r\n\r\n«Маленькая мисс Счастье» — это одновременно смешной, уютный и очень человечный фильм. Он не давит драмой, а мягко напоминает, что поддержка, искренность и простые моменты могут быть важнее идеальности.\r\n\r\nФильм хорошо подходит:\r\n\r\nкогда хочется отвлечься;\r\nкогда нужна лёгкая эмоциональная поддержка;\r\nкогда не хватает тепла и живых эмоций;\r\nдля поднятия настроения без перегруза.	https://6.kinogo.mu/search/%D0%9C%D0%B0%D0%BB%D0%B5%D0%BD%D1%8C%D0%BA%D0%B0%D1%8F%20%D0%BC%D0%B8%D1%81%D1%81%20%D0%A1%D1%87%D0%B0%D1%81%D1%82%D1%8C%D0%B5	/uploads/film_1779781481850_qsoklvf9.webp	["/uploads/film_1779781481850_khoozr5g.jpg", "/uploads/film_1779781481850_nge9dvp4.jpg", "/uploads/film_1779781481872_qh3w3dqp.jpg", "/uploads/film_1779781481873_shoxuhhn.jpg", "/uploads/film_1779781481873_5wd63frk.webp", "/uploads/film_1779781481886_6ieosu9o.webp"]	{"mood": ["lift", "distract", "inspire"], "type": ["feature"], "genre": ["comedy", "drama", "family", "slice"], "atmosphere": ["warm", "light", "cozy_a"]}	Big Beach Films	1:41:00	2006	7.8	motivation	motivating	Комедия · Драма · Семейное		Джонатан Дэйтон, Валери Фэрис	Майкл Арндт	США	«Не обязательно быть идеальным, чтобы быть счастливым.»	2026-05-26 12:44:42.062618+05	2026-05-26 12:44:42.062618+05	all	all
5	Душа	Тёплая история о смысле жизни, вдохновении и внутреннем спокойствии.\r\nФильм мягко показывает, как важно замечать простые моменты, отдыхать от постоянной гонки и возвращаться к себе.	Джо Гарднер - школьный учитель музыки, который мечтает стать джазовым музыкантом. После неожиданного события он оказывается в необычном мире, где души находят своё предназначение.\r\n\r\n«Душа» - это спокойный и эмоционально тёплый мультфильм о том, что жизнь состоит не только из больших целей и достижений, но и из маленьких моментов: прогулок, разговоров, музыки, света и ощущения присутствия в настоящем.	https://6.kinogo.mu/38173--523-dusha-2020.html	/uploads/film_1779779884922_txp8j4wm.jpg	["/uploads/film_1779779884924_21uswu5c.jpg", "/uploads/film_1779779884928_fyanzygu.jpg", "/uploads/film_1779779884991_lq89sbjq.jpg", "/uploads/film_1779779884992_wmdn15y5.jpg"]	{"mood": ["relax", "anxiety", "inspire", "tired"], "type": ["cartoon"], "genre": ["drama", "family", "slice", "animation"], "atmosphere": ["cozy_a", "calm", "light", "aesthetic", "inspiring", "warm"]}	Pixar Animation Studios	1:40:00	2020	8.2	burnout	emotional_release	Драма · Вдохновение · Анимация		Пит Доктер, Кемп Пауэрс	Пит Доктер, Майк Джонс, Кемп Пауэрс	США	«Жизнь — это не одна большая цель. Она состоит из маленьких моментов.»	2026-05-26 12:18:05.19141+05	2026-05-26 12:18:05.19141+05	all	all
6	Мой сосед Тоторо	Очень уютный и безопасный фильм для отдыха.\r\nТёплая история о детстве, природе и спокойствии, которая помогает замедлиться и почувствовать внутренний комфорт.	Две сестры переезжают вместе с отцом в деревню рядом с большим лесом, где знакомятся с необычными существами и духом леса по имени Тоторо.\r\n\r\n«Мой сосед Тоторо» — один из самых спокойных и уютных фильмов студии Ghibli. Здесь нет тяжёлого сюжета или эмоционального давления — только атмосфера тишины, природы, детства и ощущения безопасности.	https://6.kinogo.mu/search/%D0%BC%D0%BE%D0%B9%20%D1%81%D0%BE%D1%81%D0%B5%D0%B4%20%D1%82%D0%BE%D1%82%D0%BE%D1%80%D0%BE	/uploads/film_1779780582369_kiy91gv3.jpg	["/uploads/film_1779780582371_ledx5sgd.webp", "/uploads/film_1779780582374_y8ac2c33.webp", "/uploads/film_1779780582375_tdkh0w3v.jpg", "/uploads/film_1779780582375_kz6z13up.jpg", "/uploads/film_1779780582403_df5z2tg8.jpg", "/uploads/film_1779780582421_pxupj16c.jpg"]	{"mood": ["relax", "cozy", "anxiety", "tired"], "type": ["cartoon"], "genre": ["family", "fantasy", "animation", "slice"], "atmosphere": ["cozy_a", "calm", "light"]}	Studio Ghibli	1:26:00	1988	8.2	burnout	light	Анимация · Семейное · Фэнтези		Хаяо Миядзаки	Хаяо Миядзаки	Япония	«Иногда достаточно просто остановиться и почувствовать тишину вокруг.»	2026-05-26 12:29:42.605629+05	2026-05-26 12:29:42.605629+05	all	all
7	Рыбка Поньо на утёсе	Тёплый визуальный отдых без перегруза.\r\nМягкая история о дружбе, море и детском восприятии мира, которая помогает успокоиться и отвлечься от тревожных мыслей.	Маленькая рыбка по имени Поньо мечтает стать человеком и однажды знакомится с мальчиком Сосукэ. Их дружба запускает удивительное приключение, наполненное морем, магией и ощущением детской искренности.\r\n\r\n«Рыбка Поньо на утёсе» — очень светлый и визуально уютный фильм студии Ghibli. Он не перегружает сюжетом и помогает мягко переключиться, расслабиться и почувствовать спокойствие.\r\n\r\nФильм хорошо подходит:\r\n\r\nкогда хочется отвлечься;\r\nкогда тревожно;\r\nкогда не хватает лёгкости;\r\nдля спокойного вечера и отдыха.	https://6.kinogo.mu/search/%D0%A0%D1%8B%D0%B1%D0%BA%D0%B0%20%D0%9F%D0%BE%D0%BD%D1%8C%D0%BE%20%D0%BD%D0%B0%20%D1%83%D1%82%D1%91%D1%81%D0%B5	/uploads/film_1779781250238_5dn2lnej.jpg	["/uploads/film_1779781250275_50j7u82p.jpg", "/uploads/film_1779781250276_6s7q0mhk.jpg", "/uploads/film_1779781250278_py4qzb4s.webp", "/uploads/film_1779781250280_cvcx9pzh.jpg", "/uploads/film_1779781250281_fkmvenwl.jpg", "/uploads/film_1779781250297_bvwn5r4t.jpeg"]	{"mood": ["relax", "cozy", "anxiety", "tired"], "type": ["cartoon", "anime"], "genre": ["slice", "animation", "fantasy", "family"], "atmosphere": ["calm", "light", "aesthetic"]}	Studio Ghibli	1:41:00	2008	8.0	stress	antistress	Анимация · Семейное · Фэнтези		Хаяо Миядзаки	Хаяо Миядзаки	Япония	«Иногда спокойствие приходит через простые и тёплые моменты.»	2026-05-26 12:40:50.568432+05	2026-05-26 12:40:50.568432+05	all	all
9	Джули и Джулия: Готовим счастье по рецепту	Уютная атмосфера и лёгкое настроение.\r\nТёплая история о поиске вдохновения, маленьких шагах и радости в повседневности.	Фильм рассказывает сразу две истории: знаменитой кулинарной писательницы Джулии Чайлд и молодой девушки Джули, которая пытается заново почувствовать интерес к жизни через готовку и маленькие ежедневные цели.\r\n\r\n«Джули и Джулия» — очень комфортный и вдохновляющий фильм с атмосферой уюта, еды, спокойных вечеров и мягкой мотивации без давления.\r\n\r\nФильм хорошо подходит:\r\n\r\nкогда хочется расслабиться;\r\nкогда нужна лёгкая мотивация;\r\nкогда хочется чего-то тёплого и спокойного;\r\nдля отдыха после тяжёлого дня.	https://6.kinogo.mu/search/%D0%94%D0%B6%D1%83%D0%BB%D0%B8%20%D0%B8%20%D0%94%D0%B6%D1%83%D0%BB%D0%B8%D1%8F%3A%20%D0%93%D0%BE%D1%82%D0%BE%D0%B2%D0%B8%D0%BC%20%D1%81%D1%87%D0%B0%D1%81%D1%82%D1%8C%D0%B5%20%D0%BF%D0%BE%20%D1%80%D0%B5%D1%86%D0%B5%D0%BF%D1%82%D1%83	/uploads/film_1779781721182_3d1nqz2u.jpg	["/uploads/film_1779781721182_2lxjqiom.avif", "/uploads/film_1779781721183_kh6095c3.jpg", "/uploads/film_1779781721185_d47g0fa6.jpg", "/uploads/film_1779781721222_0i6eqed1.jpg", "/uploads/film_1779781721222_6iyn50b1.jpg", "/uploads/film_1779781721222_6n3m3o6b.jpg"]	{"mood": ["lift", "cozy", "inspire", "tired"], "type": ["feature"], "genre": ["comedy", "drama", "slice"], "atmosphere": ["calm", "inspiring", "cozy_a"]}	Columbia Pictures	2:03:00	2009	7.5	motivation	motivating	Комедия · Драма · Повседневность		Нора Эфрон	Нора Эфрон	США	«Иногда маленькие ежедневные вещи помогают снова почувствовать вкус жизни.»	2026-05-26 12:48:41.392775+05	2026-05-26 12:48:41.392775+05	all	all
10	Невероятная жизнь Уолтера Митти		Уолтер Митти работает в редакции журнала Life и ведёт очень спокойную, однообразную жизнь. Большую часть времени он мечтает и представляет себя героем невероятных приключений. Но однажды обычное рабочее задание превращается в настоящее путешествие через разные страны и помогает ему заново почувствовать вкус жизни.\r\n\r\n«Невероятная жизнь Уолтера Митти» — вдохновляющий и визуально красивый фильм о переменах, внутренней свободе и маленьких шагах навстречу себе. Он не давит мотивацией, а мягко напоминает, что жизнь может снова стать живой и интересной.	https://6.kinogo.mu/search/%D0%9D%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D1%8F%D1%82%D0%BD%D0%B0%D1%8F%20%D0%B6%D0%B8%D0%B7%D0%BD%D1%8C%20%D0%A3%D0%BE%D0%BB%D1%82%D0%B5%D1%80%D0%B0%20%D0%9C%D0%B8%D1%82%D1%82%D0%B8	/uploads/film_1779782360964_0bojvmcg.webp	["/uploads/film_1779782360965_gf6j7t1i.jpg", "/uploads/film_1779782360966_s27ezgoq.webp", "/uploads/film_1779782360966_vwzvs9e3.jpg", "/uploads/film_1779782360966_zdw0nk44.jpg", "/uploads/film_1779782360966_7ttcdgib.jpg", "/uploads/film_1779782360966_ezwjbmir.jpg"]	{"mood": ["inspire", "tired", "distract"], "type": ["feature"], "genre": ["comedy", "drama", "slice"], "atmosphere": ["inspiring", "calm"]}	20th Century Fox	1:54:00	2013	7.7	focus	emotional_release	Приключения · Драма · Комедия		Бен Стиллер	Стив Конрад	США		2026-05-26 12:59:21.193892+05	2026-05-26 12:59:21.193892+05	all	all
11	Человек-паук: Через вселенные		Майлз Моралес — обычный подросток из Нью-Йорка, чья жизнь резко меняется после встречи с другими версиями Человека-паука из параллельных вселенных. Вместе им предстоит остановить угрозу, способную разрушить сразу несколько миров.\r\n\r\n«Человек-паук: Через вселенные» — очень стильный, энергичный и эмоционально живой мультфильм, который сочетает юмор, музыку, экшен и красивую визуальную подачу. Он отлично помогает отвлечься от тревожных мыслей и почувствовать внутреннюю энергию.	https://6.kinogo.mu/search/%D0%A7%D0%B5%D0%BB%D0%BE%D0%B2%D0%B5%D0%BA-%D0%BF%D0%B0%D1%83%D0%BA%3A%20%D0%A7%D0%B5%D1%80%D0%B5%D0%B7%20%D0%B2%D1%81%D0%B5%D0%BB%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5	/uploads/film_1779782738561_9s8tazxg.jpg	["/uploads/film_1779782738589_vw5f1mgd.jpg", "/uploads/film_1779782738589_m8vobakn.jpg", "/uploads/film_1779782738590_fry16wp3.jpg", "/uploads/film_1779782738604_gw4cmhmj.jpg", "/uploads/film_1779782738630_9flto5bm.jpg", "/uploads/film_1779782738631_wuagr31z.webp"]	{"mood": ["distract", "lift", "inspire"], "type": ["cartoon"], "genre": ["fantasy", "animation", "family"], "atmosphere": ["warm", "inspiring"]}	Sony Pictures Animation	1:57:00	2018	8.4	motivation	emotional_release	Анимация · Приключения · Фантастика		Боб Персичетти, Питер Рэмзи, Родни Ротман	Фил Лорд, Родни Ротман	США		2026-05-26 13:05:38.8751+05	2026-05-26 13:05:38.8751+05	all	all
12	Назад в будущее		Подросток Марти МакФлай случайно отправляется в прошлое на машине времени, созданной эксцентричным учёным Доком Брауном. Теперь ему нужно не только найти способ вернуться обратно, но и случайно не изменить собственное будущее.\r\n\r\n«Назад в будущее» — очень лёгкий, живой и увлекательный фильм, который помогает отвлечься от мыслей и полностью погрузиться в историю. Несмотря на возраст, фильм до сих пор ощущается тёплым, смешным и атмосферным.	https://6.kinogo.mu/search/%D0%9D%D0%B0%D0%B7%D0%B0%D0%B4%20%D0%B2%20%D0%B1%D1%83%D0%B4%D1%83%D1%89%D0%B5%D0%B5	/uploads/film_1779783100124_5wbto3a7.jpg	["/uploads/film_1779783100146_9armn2o6.jpeg", "/uploads/film_1779783100146_ecjg9377.jpg", "/uploads/film_1779783100146_121q1keq.jpg", "/uploads/film_1779783100147_32ovw3bj.jpg", "/uploads/film_1779783100147_ak9ai4xw.jpg", "/uploads/film_1779783100183_rvg3hiqc.jpg"]	{"mood": ["lift", "distract", "inspire"], "type": ["feature"], "genre": ["comedy", "family", "fantasy"], "atmosphere": ["nostalgia", "light", "inspiring", "aesthetic"]}	Universal Pictures	1:56:00	1985	8.6	motivation	antistress	Приключения · Комедия · Фантастика		Роберт Земекис	Роберт Земекис, Боб Гейл	США		2026-05-26 13:11:40.417992+05	2026-05-26 13:11:40.417992+05	all	all
13	Джуманджи: Зов джунглей		Четверо подростков находят старую игру «Джуманджи» и неожиданно оказываются внутри виртуального мира джунглей. Теперь им предстоит пройти опасные уровни, научиться работать вместе и выбраться обратно в реальность.\r\n\r\n«Джуманджи: Зов джунглей» — яркий приключенческий фильм с большим количеством юмора, экшена и лёгкой атмосферы. Он отлично подходит для отдыха после тяжёлого дня и помогает полностью переключить внимание.	https://6.kinogo.mu/search/%D0%94%D0%B6%D1%83%D0%BC%D0%B0%D0%BD%D0%B4%D0%B6%D0%B8%3A%20%D0%97%D0%BE%D0%B2%20%D0%B4%D0%B6%D1%83%D0%BD%D0%B3%D0%BB%D0%B5%D0%B9	/uploads/film_1779785328065_a6k0q5gz.webp	["/uploads/film_1779785328067_k1qovrl6.png", "/uploads/film_1779785328081_i58wxd78.png", "/uploads/film_1779785328084_c1cwx8bw.jpg", "/uploads/film_1779785328085_7oyi0iv3.jpg", "/uploads/film_1779785328122_5yfz468k.webp", "/uploads/film_1779785328122_j32s8pen.webp"]	{"mood": ["lift", "distract", "inspire"], "type": ["feature"], "genre": ["comedy", "family", "fantasy"], "atmosphere": ["light", "inspiring", "aesthetic"]}	Columbia Pictures	1:59:00	2017	2017	motivation	antistress	Приключения · Комедия · Фэнтези		Джейк Кэздан	Крис МакКенна, Эрик Соммерс, Скотт Розенберг	США		2026-05-26 13:48:48.390279+05	2026-05-26 13:48:48.390279+05	all	all
14	Ходячий замок		Софи — тихая девушка, чья жизнь резко меняется после встречи с загадочным волшебником Хаулом. Из-за проклятия она оказывается в теле пожилой женщины и отправляется в путешествие вместе с Хаулом и его необычным ходячим замком.\r\n\r\n«Ходячий замок» — один из самых атмосферных фильмов Studio Ghibli. Здесь переплетаются магия, уют, красивые пейзажи, тёплые отношения и ощущение спокойствия даже среди хаоса.	https://6.kinogo.mu/search/%D0%A5%D0%BE%D0%B4%D1%8F%D1%87%D0%B8%D0%B9%20%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA	/uploads/film_1779785865069_ck9oa9o1.webp	["/uploads/film_1779785865069_xngign75.jpg", "/uploads/film_1779785865069_4b2lszyj.jpg", "/uploads/film_1779785865070_m6f45obl.jpg", "/uploads/film_1779785865092_x1j9uz3g.jpg", "/uploads/film_1779785865093_hibu6fpc.jpg", "/uploads/film_1779785865137_l32x68it.webp"]	{"mood": ["relax", "lift", "cozy"], "type": ["anime", "cartoon"], "genre": ["romance_romcom", "family", "fantasy", "animation"], "atmosphere": ["calm", "aesthetic", "light", "cozy_a", "warm", "nostalgia", "inspiring"]}	Studio Ghibli	1:59:00	2004	8.3	burnout	light	Фэнтези · Анимация · Приключения		Хаяо Миядзаки	Хаяо Миядзаки	Япония		2026-05-26 13:57:45.319127+05	2026-05-26 13:57:45.319127+05	all	all
47	Повар на колёсах		Известный шеф-повар Карл Каспер теряет работу после конфликта с ресторанным критиком и решает начать всё заново, открыв собственный фудтрак. Вместе с друзьями и сыном он отправляется в путешествие, постепенно возвращая себе вдохновение и радость жизни.\r\n\r\n«Повар на колёсах» — очень лёгкий и комфортный фильм с уютной атмосферой, вкусной едой, музыкой и ощущением внутреннего восстановления без давления.	https://3.kinogo.tm/filmy/26953-povar-na-kolesah.html	/uploads/film_1779813963524_2zmdmaix.jpg	["/uploads/film_1779813963525_md99b5cw.jpg", "/uploads/film_1779813963527_w9xyqe55.jpg", "/uploads/film_1779813963543_w4lx6784.jpg", "/uploads/film_1779813963543_fjqa9dju.jpg", "/uploads/film_1779813963573_4iiu3jis.jpg", "/uploads/film_1779813963585_ofsoefzr.jpg"]	{"mood": ["anxiety", "cozy", "tired", "lift"], "type": ["feature"], "genre": ["comedy", "family", "slice"], "atmosphere": ["cozy_a", "warm", "light", "calm"]}	Open Road Films	1:54:00	2014	7.4	anxiety	emotional_release	Комедия · Повседневность · Семейное		Джон Фавро	Джон Фавро	США		2026-05-26 21:46:03.600737+05	2026-05-26 21:46:03.600737+05	all	all
48	Общество мёртвых поэтов		В закрытой мужской школе появляется новый преподаватель литературы Джон Китинг. Вместо строгих правил и сухого обучения он учит учеников думать самостоятельно, замечать красоту жизни и не бояться быть собой.\r\n\r\n«Общество мёртвых поэтов» — эмоциональный и вдохновляющий фильм о взрослении, выборе собственного пути и силе творчества. Несмотря на серьёзные темы, он остаётся очень человечным и тёплым.	https://3.kinogo.tm/search/%D0%9E%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%BE%20%D0%BC%D1%91%D1%80%D1%82%D0%B2%D1%8B%D1%85%20%D0%BF%D0%BE%D1%8D%D1%82%D0%BE%D0%B2	/uploads/film_1779814295656_ijd243r7.jpg	["/uploads/film_1779814295660_7y7bywph.png", "/uploads/film_1779814295778_wk88r3rs.jpg", "/uploads/film_1779814295794_sb828uuy.jpg", "/uploads/film_1779814295795_w7rj0q5u.jpg", "/uploads/film_1779814295796_wqgtyb4w.jpg", "/uploads/film_1779814295823_8bmg0ebk.jpg"]	{"mood": ["tired", "inspire", "lift"], "type": ["feature"], "genre": ["drama", "slice"], "atmosphere": ["inspiring", "nostalgia", "aesthetic", "calm"]}	Touchstone Pictures	2:08:00	1989	8.3	focus	motivating	Драма · Повседневность · Вдохновение		Питер Уир	Том Шульман	США		2026-05-26 21:51:35.983021+05	2026-05-26 21:51:35.983021+05	all	all
49	В погоне за счастьем		Крис Гарднер пытается справиться с финансовыми трудностями, воспитывая маленького сына практически в одиночку. Несмотря на усталость, страх и нестабильность, он продолжает искать шанс изменить свою жизнь и не теряет надежду.\r\n\r\n«В погоне за счастьем» — эмоциональный и вдохновляющий фильм, который показывает силу маленьких шагов, поддержку близких и важность не сдаваться даже тогда, когда всё кажется слишком тяжёлым.	https://3.kinogo.tm/search/%D0%92%20%D0%BF%D0%BE%D0%B3%D0%BE%D0%BD%D0%B5%20%D0%B7%D0%B0%20%D1%81%D1%87%D0%B0%D1%81%D1%82%D1%8C%D0%B5%D0%BC	/uploads/film_1779814623272_vq6bznkk.jpg	["/uploads/film_1779814623284_28l1rcg9.webp", "/uploads/film_1779814623285_ywsziwmz.jpg", "/uploads/film_1779814623297_d9bin7pa.jpg", "/uploads/film_1779814623297_rlhqhr52.jpeg", "/uploads/film_1779814623300_vfit16vc.webp", "/uploads/film_1779814623300_7iji3f99.jpg"]	{"mood": ["inspire", "tired", "lift"], "type": ["feature"], "genre": ["drama", "slice"], "atmosphere": ["inspiring", "calm", "warm", "nostalgia"]}	Columbia Pictures	1:57:00	2006	8.2	stress	antistress	Драма · Биография · Вдохновение		Габриэле Муччино	Стивен Конрад	США		2026-05-26 21:57:03.466284+05	2026-05-26 21:57:03.466284+05	all	all
50	Патерсон		Патерсон работает водителем автобуса и живёт размеренной жизнью вместе со своей женой и собакой. Каждый день похож на предыдущий: работа, прогулки, разговоры и стихи, которые он пишет в свободное время.\r\n\r\n«Патерсон» — очень тихий и минималистичный фильм без громких событий и эмоционального шума. Он помогает замедлиться, выдохнуть и почувствовать красоту обычной жизни.	https://3.kinogo.tm/search/%D0%9F%D0%B0%D1%82%D0%B5%D1%80%D1%81%D0%BE%D0%BD	/uploads/film_1779814825586_6154cpk7.jpg	["/uploads/film_1779814825588_jdm28kds.jpg", "/uploads/film_1779814825616_weg0oh2d.jpg", "/uploads/film_1779814825630_dmd5zrpp.jpg", "/uploads/film_1779814825630_12smeppi.jpg", "/uploads/film_1779814825651_2e0atb8g.webp", "/uploads/film_1779814825653_8kao2v9c.jpg"]	{"mood": ["tired", "relax", "anxiety"], "type": ["feature", "doc"], "genre": ["drama", "slice"], "atmosphere": ["calm", "cozy_a", "light", "aesthetic"]}	Amazon Studios	1:58:00	2016	7.3	focus	emotional_release	Драма · Повседневность · Артхаус		Джим Джармуш	Джим Джармуш	США		2026-05-26 22:00:25.814144+05	2026-05-26 22:00:25.814144+05	all	all
51	Перед рассветом		Американец Джесси и француженка Селин случайно знакомятся в поезде и решают провести вместе одну ночь в Вене. Они гуляют по городу, разговаривают о жизни, страхах, мечтах и постепенно становятся ближе друг к другу.\r\n\r\n«Перед рассветом» — очень атмосферный и спокойный фильм, построенный почти полностью на диалогах и ощущении живого присутствия. Он помогает замедлиться и почувствовать эмоциональное тепло.	https://3.kinogo.tm/search/%D0%9F%D0%B5%D1%80%D0%B5%D0%B4%20%D1%80%D0%B0%D1%81%D1%81%D0%B2%D0%B5%D1%82%D0%BE%D0%BC	/uploads/film_1779815065206_ci47u95l.jpg	["/uploads/film_1779815065207_dxgde9fg.png", "/uploads/film_1779815065213_6kt4rmer.jpg", "/uploads/film_1779815065226_ibkuhjww.jpg", "/uploads/film_1779815065238_auxe07xz.jpg", "/uploads/film_1779815065238_gmhak6el.jpg", "/uploads/film_1779815065238_s2x2op60.jpg"]	{"mood": ["relax", "cozy", "tired"], "type": ["feature"], "genre": ["romance_romcom", "drama", "slice"], "atmosphere": ["calm", "nostalgia", "light", "aesthetic"]}	Castle Rock Entertainment	1:41:00	1995	8.0	stress	light	Романтика · Драма · Повседневность		Ричард Линклейтер	Ричард Линклейтер, Ким Кризан	США		2026-05-26 22:04:25.382794+05	2026-05-26 22:04:25.382794+05	all	all
52	Наша младшая сестра		Три сестры живут вместе в старом доме в Камакуре. После смерти отца они знакомятся со своей младшей сводной сестрой Судзу и предлагают ей переехать к ним. Постепенно героини учатся быть семьёй и находить тепло даже в самых обычных моментах.\r\n\r\n«Наша младшая сестра» — очень тихий и уютный японский фильм с красивой природой, спокойным ритмом и ощущением внутреннего комфорта. Он помогает эмоционально выдохнуть и почувствовать тепло.	https://3.kinogo.tm/search/%D0%9D%D0%B0%D1%88%D0%B0%20%D0%BC%D0%BB%D0%B0%D0%B4%D1%88%D0%B0%D1%8F%20%D1%81%D0%B5%D1%81%D1%82%D1%80%D0%B0	/uploads/film_1779815319811_07yt6laq.jpg	["/uploads/film_1779815319812_42r3a77b.jpg", "/uploads/film_1779815319812_fzufewz5.jpg", "/uploads/film_1779815319827_hrb9pt4o.jpg", "/uploads/film_1779815319827_v803y8qr.jpg", "/uploads/film_1779815319827_xu9nn236.jpg", "/uploads/film_1779815319827_e2gnrp3h.jpg"]	{"mood": ["tired", "relax", "cozy", "distract"], "type": ["feature"], "genre": ["drama", "slice", "family"], "atmosphere": ["cozy_a", "calm", "warm", "nostalgia"]}	Fuji Television Network	2:08:00	2015	7.6	sleep	light	Драма · Повседневность · Семейное		Хирокадзу Корээда	Хирокадзу Корээда	Япония		2026-05-26 22:08:40.135772+05	2026-05-26 22:08:40.135772+05	all	all
\.


--
-- Data for Name: meditations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meditations (meditation_id, title, kind, topics, cover_url, description_short, duration_min, practice_focus, difficulty_level, tip_before, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, target_role, target_gender) FROM stdin;
2	Медитация для глубокого расслабления	meditation	["recovery", "anxiety", "sleep", "focus"]	/uploads/meditation_1779819064568_4uqgv728.mp4	Спокойная медитация для расслабления, снижения тревоги и мягкого восстановления после эмоционально тяжёлого дня.	10	дыхание	beginner	Найдите тихое место и постарайтесь не отвлекаться во время практики.	youtube			https://www.youtube-nocookie.com/embed/PGKB5mENEYw	PGKB5mENEYw	2026-05-26 23:11:04.714245+05	2026-05-26 23:11:04.714245+05	all	all
3	Медитация осознанности	meditation	["recovery", "anxiety"]	/uploads/meditation_1779819427475_igikcqjn.mp4	Практика помогает успокоить мысли, снять внутреннее напряжение и почувствовать эмоциональную стабильность.	15	расслабление	beginner	Сделайте несколько глубоких вдохов перед началом медитации.	youtube			https://www.youtube-nocookie.com/embed/Juo-8PtSaLI	Juo-8PtSaLI	2026-05-26 23:17:07.673703+05	2026-05-26 23:17:07.673703+05	all	all
4	Полное погружение в себя	meditation	["recovery", "focus"]	/uploads/meditation_1779819725412_uk4ro6mm.MP4	Мягкая практика для замедления мыслей, восстановления внимания и ощущения спокойствия.	12	осознанность	beginner	Попробуйте слушать медитацию в наушниках для большего погружения.	youtube			https://www.youtube-nocookie.com/embed/edR8bnvF_wk	edR8bnvF_wk	2026-05-26 23:22:05.60369+05	2026-05-26 23:22:05.60369+05	all	all
5	Медитация для отдыха и восстановления	meditation	["recovery"]	/uploads/meditation_1779819879617_g3lc1e0c.MP4	Практика помогает эмоционально выдохнуть, отпустить напряжение и мягко восстановить силы.	5	расслабление тела	beginner	Лучше выполнять медитацию вечером или после тяжёлого дня.	youtube			https://www.youtube-nocookie.com/embed/Oa6KtWWO2lY	Oa6KtWWO2lY	2026-05-26 23:24:39.763251+05	2026-05-26 23:24:39.763251+05	all	all
6	Медитация для эмоционального восстановления	meditation	["recovery", "anxiety"]	/uploads/meditation_1779820304180_8otul7m7.MP4	Спокойная практика для эмоционального восстановления и внутреннего фокуса.	7	эмоциональное восстановления	beginner	Отключите уведомления и постарайтесь остаться в спокойной обстановке.	youtube			https://www.youtube-nocookie.com/embed/F0p2dl_XpMc	F0p2dl_XpMc	2026-05-26 23:31:44.339993+05	2026-05-26 23:31:44.339993+05	all	all
7	Медитация выздоровления	meditation	["recovery", "sleep", "focus", "anxiety"]	/uploads/meditation_1779820694351_82x44zmb.mp4	Практика помогает успокоиться перед сном, снизить тревожность и расслабить тело.	14	дыхание	beginner	Лучше слушать медитацию в тёмной и спокойной обстановке.	youtube			https://www.youtube-nocookie.com/embed/_hUOO76aWbM	_hUOO76aWbM	2026-05-26 23:38:14.600576+05	2026-05-26 23:38:14.600576+05	all	all
9	Медитация перед сном 5 минут	meditation	["sleep"]	/uploads/meditation_1779821095294_7g3u51om.mp4	Эта короткая 5 -минутная практика перед сном мягко убаюкивает и настраивает на хороший сон.	5	сон	beginner	Постарайтесь сидеть удобно и не отвлекаться на внешние звуки.	youtube			https://www.youtube-nocookie.com/embed/b-PoulK3Lls	b-PoulK3Lls	2026-05-26 23:44:55.59684+05	2026-05-26 23:45:22.077414+05	all	all
8	Медитация перед сном 3 минуты	meditation	["recovery", "sleep"]	/uploads/meditation_1779820946377_81j62deq.mp4	Эта 3-минутная медитация перед сном мягко приведет к  расслабленному состоянию для полноценного отдыха.	3	сон	beginner	Отпускайте мысли	youtube			https://www.youtube-nocookie.com/embed/TUyawG7GBlM	TUyawG7GBlM	2026-05-26 23:42:26.520367+05	2026-05-26 23:45:27.512242+05	all	all
10	Утренняя медитация 6 минут: женская энергия	meditation	["recovery"]	/uploads/meditation_1779821414932_5qomy185.MP4	Создай прекрасный новый день СЕЙЧАС с помощью этой утренней медитации для женщин. Любовь к себе.	6	осознанность	beginner	Попробуйте выполнять медитацию сразу после пробуждения.	youtube			https://www.youtube-nocookie.com/embed/z2c0Rpuw9Ac	z2c0Rpuw9Ac	2026-05-26 23:50:15.103544+05	2026-05-26 23:50:15.103544+05	all	all
11	Дыхание и телесная терапия	meditation	["recovery", "anxiety", "focus"]	/uploads/meditation_1779821723308_7u5lv02d.MP4	Практика для снижения внутреннего напряжения, тревоги и эмоциональной перегрузки.	5	дыхание	beginner	Во время практики сосредоточьтесь только на голосе и дыхании.	youtube			https://www.youtube-nocookie.com/embed/BX-i91uaxJI	BX-i91uaxJI	2026-05-26 23:55:23.458171+05	2026-05-26 23:55:23.458171+05	all	all
12	Медитация В СЛОЖНЫЕ ВРЕМЕНА: снятие тревоги, помощь нервной системе, работа с телом и сознанием	meditation	["recovery", "anxiety", "sleep", "focus"]	/uploads/meditation_1779822054944_0vyknjgy.MP4	Спокойная практика для расслабления тела, замедления мыслей и восстановления внутреннего состояния.	12	расслабление тела	beginner	Лучше выполнять практику вечером или перед отдыхом.	youtube			https://www.youtube-nocookie.com/embed/vLh3VZJBgY4	vLh3VZJBgY4	2026-05-27 00:00:55.093128+05	2026-05-27 00:00:55.093128+05	all	all
13	Дождь	sound	["sounds"]	/uploads/meditation_1779823094705_z1zp8ump.mp4		10		beginner		youtube			https://www.youtube-nocookie.com/embed/H5f8YR9Dk1c	H5f8YR9Dk1c	2026-05-27 00:18:14.845459+05	2026-05-27 00:18:14.845459+05	all	all
14	Лес	sound	["sounds"]	/uploads/meditation_1779823412619_gk1okeib.mp4		10		beginner		youtube			https://www.youtube-nocookie.com/embed/DqewBvd-bAA	DqewBvd-bAA	2026-05-27 00:23:32.777247+05	2026-05-27 00:24:57.167719+05	all	all
15	Ветер	sound	["sounds"]	/uploads/meditation_1779823621057_rsn14cmm.mp4		5		beginner		youtube			https://www.youtube-nocookie.com/embed/a3aFMAalCpk	a3aFMAalCpk	2026-05-27 00:27:01.218124+05	2026-05-27 00:27:01.218124+05	all	all
16	Волны	sound	["sounds"]	/uploads/meditation_1779823722265_yiw4tq81.mp4		10		beginner		youtube			https://www.youtube-nocookie.com/embed/mxXV7pKD3nk	mxXV7pKD3nk	2026-05-27 00:28:42.415403+05	2026-05-27 00:28:42.415403+05	all	all
17	Река	sound	["sounds"]	/uploads/meditation_1779823811705_8ytaa0eb.mp4		10		beginner		youtube			https://www.youtube-nocookie.com/embed/4hXYRXaJdtk	4hXYRXaJdtk	2026-05-27 00:30:11.887502+05	2026-05-27 00:30:11.887502+05	all	all
18	Костер	sound	["sounds"]	/uploads/meditation_1779824005658_lqlr0n6n.MP4		10		beginner		youtube			https://www.youtube-nocookie.com/embed/_YGhdeE-1IY	_YGhdeE-1IY	2026-05-27 00:33:25.864158+05	2026-05-27 00:33:25.864158+05	all	all
\.


--
-- Data for Name: music_collection_tracks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_collection_tracks (collection_id, music_id, sort_order) FROM stdin;
111	9	0
111	10	1
111	11	2
111	12	3
111	13	4
1	16	0
1	15	1
1	14	2
3	26	0
3	17	1
3	2	2
4	21	0
4	7	1
4	6	2
4	3	3
\.


--
-- Data for Name: music_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_collections (collection_id, slug, label_key, mood, cover_url, sort_order, is_active, updated_at, title) FROM stdin;
111	pop-nostalgia-111		calm_down	/uploads/music_1779759210054_ityx7n42.jpg	0	t	2026-05-26 06:50:12.527873+05	POP NOSTALGIA
1	mp-calm	musicMoodCalm	calm_down	/uploads/music_1779760648579_0y9ilgoq.jpg	0	t	2026-05-26 06:57:28.864325+05	Песни Jazz
3	mp-morning	musicMoodMorning	morning	/uploads/music_1779762409771_2oavk8rh.png	0	t	2026-05-26 07:26:49.859325+05	Доброе утро
4	mp-sleep	musicMoodSleep	rest	/uploads/music_1779762502357_92uums0j.jpeg	0	t	2026-05-26 07:28:22.516707+05	Сон
133	mp-focus	musicMoodFocus	concentration		1	t	2026-05-26 07:50:10.713551+05	Фокус
136	mp-energy	musicMoodEnergy	motivation		4	t	2026-05-26 07:50:10.720122+05	Энергия
\.


--
-- Data for Name: music_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_items (music_id, kind, title, artist, mood, genre_label, description_short, duration_min, duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, target_role, target_gender, is_featured_pick) FROM stdin;
2	track	old songs but it's lofi remix	Lo-fi Music	recovery	lofi		24	24:00	Music2	/uploads/music_1779757990208_9d5e9197.jpg	youtube			https://www.youtube-nocookie.com/embed/BrnDlRmW5hs	BrnDlRmW5hs	2026-05-26 06:13:10.44471+05	2026-05-26 06:13:10.44471+05	all	all	f
3	track	The quiet beauty of everyday life | Piano Playlist	James Quinn	tired	piano		34	34:00	Music2	/uploads/music_1779758176569_i4q9hcih.png	youtube			https://www.youtube-nocookie.com/embed/UKbZ4r88z3Q	UKbZ4r88z3Q	2026-05-26 06:16:16.737658+05	2026-05-26 06:16:16.737658+05	all	all	f
4	track	aruarian dance	Nujabes	calm_down	ambient		3	3:00	Music2	/uploads/music_1779758283904_20t9e40e.png	youtube			https://www.youtube-nocookie.com/embed/qYcoJpqCha4	qYcoJpqCha4	2026-05-26 06:18:04.085216+05	2026-05-26 06:18:04.085216+05	all	all	f
5	track	Ludovico Einaudi - Nuvole Bianche	Rousseau	tired	piano		5	5:00	Music2	/uploads/music_1779758372798_tblgo29e.png	youtube			https://www.youtube-nocookie.com/embed/4VR-6AS0-l4	4VR-6AS0-l4	2026-05-26 06:19:32.95395+05	2026-05-26 06:19:32.95395+05	all	all	f
6	track	River Flows in You	YIRUMA place / 이루마 official	calm_down	piano		3	3:00	Music2	/uploads/music_1779758499639_4crub5zm.png	youtube			https://www.youtube-nocookie.com/embed/7maJOI3QMu0	7maJOI3QMu0	2026-05-26 06:21:39.780024+05	2026-05-26 06:21:39.780024+05	all	all	f
7	track	Rainstorm Sounds for Relaxing, Focus or Deep Sleep | Nature White Noise | 8 Hour Video	Calm	calm_down	nature_sounds		180	180:00	Music2	/uploads/music_1779758617708_umviitji.png	youtube			https://www.youtube-nocookie.com/embed/yIQd2Ya0Ziw	yIQd2Ya0Ziw	2026-05-26 06:23:37.973486+05	2026-05-26 06:23:37.973486+05	all	all	f
8	track	" 𝘢𝘭𝘭 𝘸𝘦 𝘩𝘢𝘷𝘦 𝘪𝘴 𝘯𝘰𝘸. " ─a playlist + voiceovers/sfx ;;	w i n t e r	recovery	soft_vocals		52	52:00	Music2	/uploads/music_1779758761127_ckkyvjp6.png	youtube			https://www.youtube-nocookie.com/embed/lr1fTEi9EMA	lr1fTEi9EMA	2026-05-26 06:26:01.273586+05	2026-05-26 06:26:01.273586+05	student	female	f
9	track	Call Me Maybe	Carly Rae Jepsen	recovery			3	3:00	Music2	/uploads/music_1779759467784_2fd8gv8k.avif	youtube			https://www.youtube-nocookie.com/embed/fWNaR-rxAic	fWNaR-rxAic	2026-05-26 06:37:47.889855+05	2026-05-26 06:37:47.889855+05	student	all	f
10	track	Eenie Meenie	Sean Kingston, Justin Bieber	recovery			3	3:00	Music2	/uploads/music_1779759622513_b6722ms0.avif	youtube			https://www.youtube-nocookie.com/embed/prmmCg5bKxA	prmmCg5bKxA	2026-05-26 06:40:22.690335+05	2026-05-26 06:40:22.690335+05	student	all	f
11	track	Moves Like Jagger	Maroon 5 ft. Christina Aguilera	distract			3	3:00	Music2	/uploads/music_1779759725589_16yd1zmo.avif	youtube			https://www.youtube-nocookie.com/embed/iEPTlhBmwRg	iEPTlhBmwRg	2026-05-26 06:42:05.731502+05	2026-05-26 06:42:05.731502+05	student	all	f
12	track	Love The Way You Lie	Eminem  ft. Rihanna	calm_down			3	3:00	Music2	/uploads/music_1779760039937_us20lm0x.avif	youtube			https://www.youtube-nocookie.com/embed/uelHwf8o7_U	uelHwf8o7_U	2026-05-26 06:47:20.220165+05	2026-05-26 06:47:20.220165+05	student	all	f
13	track	Uptown Funk	Mark Ronson ft. Bruno Mars	distract			3	3:00	Music2	/uploads/music_1779760189685_cfmp80v2.jpg	youtube			https://www.youtube-nocookie.com/embed/OPf0YbXqDm0	OPf0YbXqDm0	2026-05-26 06:49:49.899448+05	2026-05-26 06:49:49.899448+05	student	all	f
14	track	Smooth Operator 1984	Sade	distract	jazz		3	3:00	Music2	/uploads/music_1779760389968_h1ce50jx.avif	youtube			https://www.youtube-nocookie.com/embed/4TYv2PhG89A	4TYv2PhG89A	2026-05-26 06:53:10.248285+05	2026-05-26 06:53:10.248285+05	all	all	f
15	track	What A Wonderful World	Louis Armstrong	distract	jazz		2	2:00	Music2	/uploads/music_1779760468832_l5grzzip.avif	youtube			https://www.youtube-nocookie.com/embed/VqhCQZaH4Vs	VqhCQZaH4Vs	2026-05-26 06:54:28.972857+05	2026-05-26 06:54:28.972857+05	all	all	f
16	track	Fly Me To The Moon	Frank Sinatra	distract	jazz		2	2:00	Music2	/uploads/music_1779760575084_4ao8ogen.avif	youtube			https://www.youtube-nocookie.com/embed/ZEcqHA7dbwM	ZEcqHA7dbwM	2026-05-26 06:56:15.253765+05	2026-05-26 06:56:15.253765+05	all	all	f
17	track	Атмосфера нью-йоркской кофейни — сладкая джазовая музыка босса-нова для работы, учебы и отдыха	Jazz Radio Channel	distract	jazz		180	180:00	Music2	/uploads/music_1779760832560_gln09sr6.png	youtube			https://www.youtube-nocookie.com/embed/PRAGLqfNK1o	PRAGLqfNK1o	2026-05-26 07:00:32.891711+05	2026-05-26 07:00:32.891711+05	all	all	f
18	track	Sunset Lover	Petit Biscuit	distract	chill_electronic		3	3:00	Music2	/uploads/music_1779760932956_rqyz60fk.png	youtube			https://www.youtube-nocookie.com/embed/4fQeaM62mOY	4fQeaM62mOY	2026-05-26 07:02:13.200713+05	2026-05-26 07:02:13.200713+05	all	all	f
19	track	1 A.M Study Session	Lofi Girl	concentration			60	60:00	Music2	/uploads/music_1779761050311_nnhya4gc.png	youtube			https://www.youtube-nocookie.com/embed/lTRiuFIWV54	lTRiuFIWV54	2026-05-26 07:04:10.578794+05	2026-05-26 07:04:10.578794+05	all	all	f
20	track	Howl's Moving Castle - Merry go round of Life	cover by Grissini Project	rest	instrumental		6	6:00	Music2	/uploads/music_1779761222845_0cmjxyju.jpg	youtube			https://www.youtube-nocookie.com/embed/J6qIzKxmW8Y	J6qIzKxmW8Y	2026-05-26 07:07:03.023446+05	2026-05-26 07:07:03.023446+05	all	all	f
21	track	[Успокаивающее расслабляющее сон] Медитация	Мономан	evening	acoustic		73	73:00	Music2	/uploads/music_1779761354313_wdm92rk5.png	youtube			https://www.youtube-nocookie.com/embed/FjHGZj2IjBk	FjHGZj2IjBk	2026-05-26 07:09:14.471795+05	2026-05-26 07:09:14.471795+05	all	all	f
22	track	Forest and Nature Sounds 10 Hours	scrapper9000	calm_down	nature_sounds		600	600:00	Music2	/uploads/music_1779761701528_q6g3bkut.png	youtube			https://www.youtube-nocookie.com/embed/OdIJ2x3nxzQ	OdIJ2x3nxzQ	2026-05-26 07:15:01.685162+05	2026-05-26 07:15:21.122175+05	all	all	f
23	track	Beautiful Relaxing Music for Stress Relief	Лучшая Музыка для Медитации, Йоги, Релаксации и Сна	anxious	ambient		181	181:00	Music2	/uploads/music_1779761901101_bpuqjdog.png	youtube			https://www.youtube-nocookie.com/embed/lFcSrYw-ARY	lFcSrYw-ARY	2026-05-26 07:18:21.284547+05	2026-05-26 07:18:21.284547+05	all	all	f
24	track	A playlist that makes you feel calm and dreamy..	Pianza	rest			61	61:00	Music2	/uploads/music_1779762026688_ha3o9cea.png	youtube			https://www.youtube-nocookie.com/embed/MWPYhebILb4	MWPYhebILb4	2026-05-26 07:20:26.846637+05	2026-05-26 07:20:26.846637+05	all	all	f
25	track	Weak	AJR	motivation	chill_electronic		3	3:00	Music2	/uploads/music_1779762211347_xzhodp0u.avif	youtube			https://www.youtube-nocookie.com/embed/txCCYBMKdB0	txCCYBMKdB0	2026-05-26 07:23:31.513578+05	2026-05-26 07:23:31.513578+05	all	all	f
26	track	Morning vibes playlist	Saturday Melody	morning	soft_vocals		56	56:00	Music2	/uploads/music_1779762345738_3x6c2nv9.png	youtube			https://www.youtube-nocookie.com/embed/RCQmapr_1z0	RCQmapr_1z0	2026-05-26 07:25:45.891765+05	2026-05-26 07:37:15.702738+05	all	all	t
\.


--
-- Data for Name: podcast_episodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.podcast_episodes (podcast_id, title, show_name, description_short, meta_line, topic, episode_num, duration_min, duration_display, is_featured_pick, cover_url, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, tags, target_role, target_gender) FROM stdin;
7	Нас не существует? Парадоксы нашего сознания. Философ Антон Кузнецов		Сознание - это часть ментальной жизни, у которой есть испытываемые приватные субъективные аспекты, когда есть свойство «каково это» для организма находится в том или ином состоянии.	52 мин - Выпуск 6	psych	1	52	52:00	f	/uploads/podcast_1779622621507_yfdwq2jx.jpg	youtube			https://www.youtube-nocookie.com/embed/zmCAdIXVQgM	zmCAdIXVQgM	2026-05-24 16:37:01.640386+05	2026-05-24 16:37:01.640386+05	{"theme": ["psychology", "mindfulness", "life_balance"], "format": ["long"], "situation": ["distract", "need_support"]}	all	all
2	ПОЖИРАТЕЛИ ЭНЕРГИИ: ПОЧЕМУ НЕТ СИЛ И КАК ПОБОРОТЬ УСТАЛОСТЬ? Радислав Гандапас		Вместе с Радиславом мы обсудили: что забирает у нас  энергию? Почему наша батарейка разряжается? Как вернуть себе бодрость и радость жизни? Почему непрочитанная почта или долгое принятие решения плохо на нас влияют? Нужно ли жертвовать сном и отдыхом ради карьеры? И как победить усталость? Ответы на все эти и другие вопросы вы найдете в этом выпуске.\r\n\r\nУ нас в гостях Радислав Гандапас — Президент Ассоциации спикеров СНГ. Занимает 27 позицию в мировом рейтинге TOP 30 Global Gurus. Executive-коуч и автор 12 книг по лидерству, ораторскому искусству и личной эффективности, изданных на 7 языках.	1 час 26 мин - Выпуск 1	psych	1	86	86:00	f	/uploads/podcast_1779619874708_r6r03b7j.jpg	youtube			https://www.youtube-nocookie.com/embed/Qo7GZiJZrj4	Qo7GZiJZrj4	2026-05-24 15:51:14.90172+05	2026-05-24 16:37:20.836235+05	{"theme": ["psychology", "burnout"], "format": ["long"], "situation": ["burnout_feel"]}	all	all
3	Я ничего не хочу: работа с апатией	Подкасты	Иногда мы сталкиваемся с состоянием, когда просто не хочется ничего делать	14 мин - Выпуск 2	mental	1	24	24:00	f	/uploads/podcast_1779620407833_vxgd27ia.jpg	youtube			https://www.youtube-nocookie.com/embed/xKLq_ddovP4	xKLq_ddovP4	2026-05-24 16:00:08.006751+05	2026-05-24 16:37:39.254262+05	{"theme": ["anxiety_stress", "burnout"], "format": ["short"], "situation": ["tired", "burnout_feel", "no_motiv"]}	all	all
4	Негативные мысли, тревожность и панические атаки: как справиться? | Марина Нахалова		Как работать с тревогой? Почему возникают негативные мысли?	1 час 9 мин - Выпуск 3	psych	3	68	68:00	f	/uploads/podcast_1779620865559_ffcm64nd.jpg	youtube			https://www.youtube-nocookie.com/embed/67OfUn18Ot0	67OfUn18Ot0	2026-05-24 16:07:45.701003+05	2026-05-24 16:37:48.996096+05	{"theme": ["psychology", "anxiety_stress"], "format": ["long"], "situation": ["calm", "distract", "anxious"]}	all	all
5	Если тебе тревожно и беспокойно		Подкаст от Alina Solopova	12 мин - Выпуск 4	mental	4	12	12:00	f	/uploads/podcast_1779621751497_ku17zuau.jpg	youtube			https://www.youtube-nocookie.com/embed/teuQGZQ3SQU	teuQGZQ3SQU	2026-05-24 16:22:31.663848+05	2026-05-24 16:38:02.679055+05	{"theme": ["anxiety_stress", "support"], "format": ["medium"], "situation": ["anxious", "need_support"]}	all	all
6	Как избавиться от низкой самооценки и почувствовать себя живым?		Марина Нахалова — «Дело жизни»	51 мин - Выпуск 5	psych	6	51	51:00	f	/uploads/podcast_1779621988004_0gf49j9e.jpg	youtube			https://www.youtube-nocookie.com/embed/6He5fDxtSeY	6He5fDxtSeY	2026-05-24 16:26:28.141679+05	2026-05-24 16:38:16.341255+05	{"theme": ["psychology"], "format": ["long"], "situation": ["burnout_feel", "anxious"]}	all	all
8	Баланс в жизни		Подкаст от канала Соколовский | Мысли Вслух	11 мин - Выпуск 7	mind	1	11	11:00	f	/uploads/podcast_1779623052529_3i0szwf4.jpg	youtube			https://www.youtube-nocookie.com/embed/ynot-8irtCg	ynot-8irtCg	2026-05-24 16:44:12.663816+05	2026-05-24 16:44:12.663816+05	{"theme": ["life_balance", "self_growth"], "format": ["short"], "situation": ["no_motiv"]}	all	all
9	Когда ничего не хочется и теряешь веру в себя, что это и как быть?		Подкаст от канала Десять тысяч попыток. Негативные мысли и состояния влияют на наше здоровье и качество жизни, имеют свои причины и с ними можно справляться.	12 мин - Выпуск 8	psych	1	12	12:00	f	/uploads/podcast_1779623514478_s6nusfbf.jpg	youtube			https://www.youtube-nocookie.com/embed/Pqd9eM_cqi8	Pqd9eM_cqi8	2026-05-24 16:51:54.6177+05	2026-05-24 16:51:54.6177+05	{"theme": ["psychology", "burnout", "motivation", "mindfulness"], "format": ["medium"], "situation": ["no_motiv"]}	all	all
\.


--
-- Data for Name: practice_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.practice_favorites (user_id, practice_key, created_at) FROM stdin;
\.


--
-- Data for Name: practice_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.practice_sessions (session_id, user_id, practice_key, duration_seconds, created_at) FROM stdin;
\.


--
-- Data for Name: psychologist_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_documents (document_id, user_id, file_path, original_name, created_at) FROM stdin;
1	13	/uploads/psych_doc_1779418759295_67734eca.pdf	Ð ÐµÐ·ÑÐ¼Ðµ.pdf	2026-05-22 07:59:20.46406
\.


--
-- Data for Name: psychologist_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_invitations (invitation_id, token, email, invite_name, work_phone, organization, specialist_level, invited_by, expires_at, used_at, used_by_user_id, created_at) FROM stdin;
1	40c3836edf284a51151cd2de8ada2e86c7158a5980837609244146b68dc5d2d5	konyrbaevaaida624@gmail.com	Аида	87750716520	Нархоз	практикующий психолог	1	2026-05-28 21:43:15.421	\N	\N	2026-05-21 21:43:15.422376
2	49ae827361610a1fb25195a0091baf01c51193366aee0fae4c2dddb517c1275b	aida.konyrbayeva@narxoz.kz	аида	87756787777	нархоз	практикующий	1	2026-05-28 21:48:38.058	\N	\N	2026-05-21 21:48:38.059595
3	d033e8936ca8fc8e3fc889e2e1cb5473fa74d9fde053e1e781105cfa328cc146	bluvbutterfly@gmail.com	аида	877776766666	narxoz	начинающий	1	2026-05-28 21:52:05.299	\N	\N	2026-05-21 21:52:05.300858
4	b1b753730ecfdbe2e5ac10c438db62b8eddda6f83ecc1e94ac8e5af15943b009	edu.krg09@gmail.com	Махаббат	87777675566	Tengri	начинающий	1	2026-05-28 21:58:11.72	2026-05-22 07:59:20.46406	13	2026-05-21 21:58:11.720579
\.


--
-- Data for Name: psychologist_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_profiles (user_id, account_status, organization, specialist_level, work_phone, whatsapp, education, specialization, experience_years, bio, invited_by, invitation_id, reviewed_by, reviewed_at, review_note, created_at, updated_at) FROM stdin;
13	approved	Tengri	начинающий	87777675566	87777675566	нархоз	психолог	2	2 года стажа работы	1	4	1	2026-05-22 07:59:46.898773	\N	2026-05-22 07:59:20.46406	2026-05-24 18:08:48.613373
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, test_id, question_text, options, order_num) FROM stdin;
1	2	Я чувствую себя эмоционально истощённым от учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
2	2	К концу учебного дня я чувствую себя опустошённым	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
3	2	Я чувствую усталость, когда думаю о необходимости идти на занятия	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
4	2	Мне стало безразлично, успею ли я сдать задание в срок	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
5	2	Я сомневаюсь в важности учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
6	2	Я эффективно решаю учебные задачи	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
7	2	Я чувствую вдохновение от учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
8	2	Мне удаётся создавать спокойную атмосферу на занятиях	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
9	2	Я чувствую стимул и заряжен после выполнения заданий	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
10	3	Мне трудно заставить себя открыть учебные материалы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
11	3	Я чувствую, что выгорел от дедлайнов и контрольных	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
12	3	После учёбы у меня не остаётся сил на отдых и общение	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
13	3	Я откладываю задания, даже когда понимаю их важность	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
14	3	Мне кажется, что я отстаю от программы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
15	3	Я раздражаюсь из-за мелочей, связанных с учёбой	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
16	3	Мне трудно концентрироваться на лекциях и текстах	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
17	3	Я чувствую вину, если отдыхаю вместо учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
18	4	Я чувствую себя эмоционально опустошённым из-за работы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
19	4	Утром мне тяжело идти на работу	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
20	4	После рабочего дня я чувствую себя «выжатым»	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
21	4	Я стал меньше сопереживать проблемам студентов/коллег	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
22	4	Мне трудно сохранять энтузиазм в профессии	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
23	4	Я эффективно решаю рабочие задачи	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
24	4	В моей работе много интересного и смысла	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
25	4	Я умею отключаться от работы вне рабочего времени	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
26	4	Я доволен тем, чего достигаю на работе	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
37	6	За последние 2 недели как часто вас беспокоило ощущение нервозности, тревоги или напряжённости?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	1
38	6	Как часто вам было трудно остановить беспокойство или контролировать его?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	2
39	6	Как часто вы слишком сильно беспокоились о разных вещах?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	3
40	6	Как часто вам было трудно расслабиться?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	4
41	6	Как часто вы были настолько беспокойны, что трудно усидеть на месте?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	5
42	6	Как часто вы легко раздражались или злились?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	6
43	6	Как часто вам казалось, что может случиться что-то плохое?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	7
54	3	Мне трудно верить, что смогу стабильно тянуть учёбу до конца семестра	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
59	5	Мне кажется, что на меня свалилось слишком много задач	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
60	5	Я не успеваю восстанавливаться между рабочими или учебными днями	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
61	5	Мне трудно сказать «нет» новым обязанностям	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
62	5	Из-за нагрузки я жертвую сном	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
63	5	Я чувствую постоянное ощущение спешки	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
64	5	Мне не хватает времени на семью, друзей и хобби	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
65	5	Я раздражаюсь, когда меня отвлекают от дел	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
66	5	В конце недели я чувствую себя полностью вымотанным	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
67	5	Я чувствую, что теряю интерес к тому, что раньше мотивировало	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
77	7	Я чувствую усталость (физическую и эмоциональную)	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
78	7	Мне трудно сосредоточиться на задачах	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
79	7	Я испытываю тревогу или напряжение	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
80	7	Я откладываю дела или избегаю их	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
81	7	День ощущается тяжёлым или неприятным	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
82	7	Мне трудно расслабиться	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
83	7	Я раздражителен или легко выхожу из себя	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
84	7	Мне не хватает сил на то, что раньше давалось легче	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
85	7	К вечеру я чувствую опустошённость	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
\.


--
-- Data for Name: reading_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reading_items (reading_id, kind, title, category, cover_url, description_short, body_full, read_url, created_at, updated_at, target_role, target_gender) FROM stdin;
9	book	Шоколад	restreads	/uploads/reading_1779876803105_xyklvxoj.jpg	Сонное спокойствие маленького французского городка нарушено приездом молодой женщины Вианн и ее дочери. Они появились вместе с шумным и ярким карнавальным шествием, а когда карнавал закончился, его светлая радость осталась в глазах Вианн, открывшей здесь свой шоколадный магазин. Каким-то чудесным образом она узнает о сокровенных желаниях жителей городка и предлагает каждому именно такое шоколадное лакомство, которое заставляет его вновь почувствовать вкус к жизни.		https://loveread.ec/read_book.php?id=3309&p=1	2026-05-27 15:13:23.293233+05	2026-05-27 15:13:23.293233+05	all	all
3	book	Тревожные люди	lightread	/uploads/reading_1779875816813_w1j4edu1.jpg	Тёплая и ироничная история о людях, тревоге, одиночестве и поддержке. Книга помогает отвлечься и почувствовать эмоциональное тепло.		https://flibusta.su/book/1000-trevozhnyie-lyudi/read/	2026-05-27 14:56:57.030087+05	2026-05-27 14:56:57.030087+05	all	all
4	book	Маленькая жизнь	fiction	/uploads/reading_1779876120868_8hyf2sa9.jpg	Четверо друзей - талантливый архитектор Малкольм, начинающий актер Виллем, уверенный в собственной неповторимости художник Джей-Би и гениальный юрист и математик Джуд - пытаются добиться успеха в Нью-Йорке, но оказывается, что ни карьера, ни деньги, ни слава не могут справиться с прошлым, если оно сильнее жизни… Книга содержит нецензурную брань.		https://loveread.ec/read_book.php?id=58025&p=1	2026-05-27 15:02:01.038998+05	2026-05-27 15:02:01.038998+05	all	all
5	book	Кафе на краю земли	selfgrowth	/uploads/reading_1779876203629_44zujkif.jpg	Она издана миллионными тиражами и переведена на 30 языков. Каждый из нас время от времени задает себе вопросы: «кто я?», «куда я иду?», «счастлив ли я?». Но найти ответы и следовать своему собственному пути не так-то просто. Главный герой этой книги Джон едва ли пытался осмыслить свою жизнь до того момента, как случайно оказался в загадочном кафе «Почему». Одна ночь в этом месте на краю земли заставила его задуматься о себе и осознать, что в жизни для него действительно важно и ценно. Удивительная и вдохновляющая история о том, как избавиться от мимолетной суеты современного мира, отбросить страхи и сомнения и открыться для счастливых перемен.		https://loveread.ec/read_book.php?id=71212&p=1	2026-05-27 15:03:23.784666+05	2026-05-27 15:03:23.784666+05	all	all
6	book	Атомные привычки	readsmotive	/uploads/reading_1779876387934_x8zr1ewq.jpg	Может ли одна монетка сделать человека богатым? Конечно, нет, скажете вы. Но если добавить еще одну? И еще? И еще? В какой-то момент количество перейдет в качество. А теперь представьте, что одно крошечное изменение кардинально меняет всю жизнь. Звучит фантастически! Но, как и в случае с монетками, срабатывает эффект сложного процента. И вот уже маленькое, но регулярное действие привело к большим результатам. Атомные привычки – маленькие изменения, в которых скрыта огромная мощь!		https://loveread.ec/read_book.php?id=84968&p=1	2026-05-27 15:06:28.106785+05	2026-05-27 15:06:28.106785+05	all	all
7	book	Норвежский лес	fiction	/uploads/reading_1779876629216_5hysqnv3.jpg	Главный герой, 37-летний Тоору Ватанабэ, слышит в аэропорту мелодию The Beatles и переносится воспоминаниями в свои студенческие годы в Токио конца 1960-х. Сюжет строится вокруг его сложных отношений с двумя совершенно разными девушками — хрупкой, застрявшей в прошлом Наоко и живой, импульсивной Мидори.		https://loveread.ec/read_book.php?id=7475&p=1	2026-05-27 15:10:29.365167+05	2026-05-27 15:10:29.365167+05	all	all
8	book	Тонкое искусство пофигизма	psychology	/uploads/reading_1779876709106_r6ag03a0.jpg	Современное общество пропагандирует культ успеха: будь умнее, богаче, продуктивнее — будь лучше всех. Соцсети изобилуют историями на тему, как какой-то малец придумал приложение и заработал кучу денег, статьями в духе «Тысяча и один способ быть счастливым», а фото во френдленте создают впечатление, что окружающие живут лучше и интереснее, чем мы. Однако наша зацикленность на позитиве и успехе лишь напоминает о том, чего мы не достигли, о мечтах, которые не сбылись. Как же стать по-настоящему счастливым? Популярный блогер Марк Мэнсон в книге «Тонкое искусство пофигизма» предлагает свой, оригинальный подход к этому вопросу.		https://loveread.ec/read_book.php?id=66688&p=1	2026-05-27 15:11:49.244719+05	2026-05-27 15:11:49.244719+05	all	all
17	article	Гореть, но не сгорать: 7 книг про выгорание для тех, кто очень устал	burnout	/uploads/reading_1779878864932_hnz0cn04.jpg	Уставать от работы и других обязанностей — это нормально. Тут главное научиться себе помогать — правильно отдыхать, бороться с переработками и не поддаваться унынию. Собрали книги, которые станут хорошими советчиками в этом вопросе.	«Выгорание», Эмили и Амелия Нагоски\r\n\r\n\r\n<img src="/uploads/reading_body_1779878699497_bj56jz16.jpg" alt="" class="article-inline-img" />\r\n\r\nВыгорание знакомо всем людям, однако авторы этой книги, две сестры Эмили и Амелия, сужают тему и говорят о выгорании именно у женщин. Книга рассказывает о формировании стресса с научной точки зрения и очень доброжелательно даёт практические советы, которые помогут не потерять себя в безумной гонке дом — работа — дети — красота— отношения. Главный посыл книги: позаботьтесь с искренней любовью сначала о себе, а уже потом думайте обо всех остальных. \r\n\r\n«Выдохшиеся. Когда кофе, шопинг и отпуск уже не работают», Арианна Хаффингтон\r\n\r\n\r\n\r\n<img src="/uploads/reading_body_1779878722766_gzij706n.jpg" alt="" class="article-inline-img" />\r\n\r\nНазвание книги говорит само за себя — она о серьёзном выгорании, когда вам уже не хватает просто выспаться или сходить на массаж, чтобы восстановиться. Автор знает, о чём говорит, потому что Арианна Хаффингтон — соосновательница и бывший главный редактор газеты The Huffington Post. В какой-то момент она поняла: деньги, карьера и общественное признание порой не приносят истинного счастья. \r\n\r\nВ этой книге Арианна ссылается на научные факты и личный опыт, предлагая читателю пересмотреть свой образ жизни и научиться останавливаться в бесконечной гонке, чтобы наконец увидеть нечто действительно важное. Автор рассказывает, как правильно отдыхать и что нужно делать, чтобы поймать баланс во всех сферах.\r\n\r\n«Форс-мажор не приговор. Правила ведения дел в эпоху стабильной нестабильности», Сергей Елин\r\n\r\n\r\n<img src="/uploads/reading_body_1779878751645_vwy7eqph.jpg" alt="" class="article-inline-img" />\r\n\r\nЧтение на злобу дня — 2020 год для многих стал переломным. Финансовые проблемы и экономический кризис, общий стресс и нервозность. Как не поддаваться панике, найти точку опоры внутри себя и даже извлечь выгоду из сложившейся ситуации? \r\n\r\nАвтор этой книги собрал множество техник по тайм-менеджменту, планированию, целеполаганию и психологии, которые помогут навести порядок в делах и обрести спокойствие. Сергей Елин уверен, что с помощью упражнений можно изменить свой тип мышления и начать видеть возможность роста там, где другие замечают лишь трудности. \r\n\r\n«Когда всё рушится», Пема Чодрон\r\n\r\n\r\n<img src="/uploads/reading_body_1779878777304_rsyr7pmn.jpg" alt="" class="article-inline-img" />\r\n\r\nБуддистская монахиня Пема Чодрон уверена, что любой кризис — это лишь переходное время, что-то вроде трамплина, позволяющего нам взлететь ещё выше над своими проблемами и неудачами. Она много путешествовала, побывала в Тибете, общалась с мыслителями и учителями, чтобы резюмировать весь свой опыт в одной книге.\r\n\r\nЗдесь и философские размышления о наших страхах и комплексах, и научные факты, и разные техники медитации. Пема уверена, что даже в самый трудный момент себе можно эффективно помочь, если правильно «настроить» мозг. \r\n\r\n«На пределе», Эрик Ларссен\r\n\r\n\r\n<img src="/uploads/reading_body_1779878798648_bzu84d6r.jpg" alt="" class="article-inline-img" />\r\n\r\nТренер по личностному росту Эрик Ларссен однажды прошёл «адскую неделю» — это тяжёлый интенсив для подготовки бойцов спецназа в норвежской армии. Затем Ларссен адаптировал курс для обычной жизни: вас ждут семь дней, возможность бросить себе вызов и победить. При этом автор книги уверен — пройти путь до конца способен каждый человек. К слову, интересный вариант необычно провести новогодние каникулы. \r\n\r\n«Человек уставший. Как победить хроническую усталость и вернуть себе силы, энергию и радость жизни», Сохэр Рокед\r\n\r\n\r\n<img src="/uploads/reading_body_1779878817310_3hcnc3ht.jpg" alt="" class="article-inline-img" />\r\n\r\nЧто делать, если сил ни на что нет, а усталость уже стала хронической? Ведь это знакомо каждому второму жителю большого города. Простым языком семейный врач Сохэр Рокед объясняет, что происходит с организмом, когда мы не высыпаемся и не успеваем психологически расслабиться. Важно осознать суть проблемы и её последствия, чтобы найти качественное решение. \r\n\r\nАвтор даёт рекомендации по всем фронтам — от тестов для определения уровня усталости и медитативных техник до несложной гимнастики на каждый день и даже рецептов вкусных и полезных блюд, которые помогут восстановить организм. \r\n\r\n«Wellbeing: управление стрессом и развитие креативности», Марина Безуглова\r\n\r\n\r\n<img src="/uploads/reading_body_1779878838159_sqliloi5.jpg" alt="" class="article-inline-img" />\r\n\r\nИнтересная книга для тех, кто верит лишь в научные факты и ищет пошаговые рекомендации. Здесь приведены последние исследования в области когнитивных возможностей мозга, его способности противостоять стрессу и находить оптимальные решения в сложных ситуациях. Вы узнаете, как задействовать весь свой потенциал, чтобы быть креативнее, успевать больше, а уставать при этом — меньше. Да-да, такое возможно, если правильно пользоваться теми ресурсами, которые у нас есть. \r\n\r\nОбложка: public domain / New Africa / Shutterstock / Burning Hut	https://burninghut.ru/knigi-pro-vygoranie/	2026-05-27 15:47:45.087259+05	2026-05-27 15:47:45.087259+05	all	all
10	book	Маленький принц	inspire	/uploads/reading_1779876978573_p43qnmwj.webp	Леону Верту. Прошу детей простить меня за то, что я посвятил эту книжку взрослому. Скажу в оправдание: этот взрослый мой самый лучший друг. И еще: он понимает все на свете, даже детские книжки. И, наконец, он живет во Франции, а там сейчас голодно и холодно. И он очень нуждается в утешении. Если же все это меня не оправдывает, я посвящу книжку тому мальчику, каким был когда-то мой взрослый друг. Ведь все взрослые сначало были детьми, только мало кто из них об этой помнит. И так, я исправляю посвящение: Леону Верту, когда он был маленький. Чтобы читать онлайн книгу "Маленький принц" перейдите по указанной ссылке. Приятного Вам чтения.		https://loveread.ec/read_book.php?id=1833&p=1	2026-05-27 15:16:18.746817+05	2026-05-27 15:16:18.746817+05	all	all
11	book	Гордость и предубеждение	fiction	/uploads/reading_1779877033919_ovjltzfd.webp	"Гордость и предубеждение" - это история человеческих душ, остроумно, легко и изящно рассказанная знаменитой английской писательницей Джейн Остин. Выдержав испытание несколькими эпохами, роман остается одним из лучших в мировой классике. Читая эту книгу, украшенную превосходными иллюстрациями Хью Томсона, вы, несомненно, получите истинное удовольствие!		https://loveread.ec/read_book.php?id=2341&p=1	2026-05-27 15:17:14.046514+05	2026-05-27 15:17:14.046514+05	all	all
12	book	Убить пересмешника	inspire	/uploads/reading_1779877105949_uspum4h0.jpg	Роман «Убить пересмешника...», впервые опубликованный в 1960 году, имел оглушительный успех и сразу же стал бестселлером. Это и неудивительно: Харпер Ли (1926–1975), усвоив уроки Марка Твена, нашла свой собственный стиль повествования, который позволил ей показать мир взрослых глазами ребёнка, не упрощая и не обедняя его. Роман был удостоен одной из самых престижных премий США по литературе — Пулитцеровской, печатался многомиллионными тиражами. Его перевели на десятки языков мира и продолжают переиздавать по сей день. «Убить пересмешника...» — это роман о нравах. Действие его точно локализовано во времени и в пространстве: провинциальный городок в Алабаме — Мейкомба — в середине 1930-х гг., то есть в пору тяжёлой экономической депрессии. Здесь показаны основные социальные группировки-богатые землевладельцы, негры, работающие на них потомки плантаторов, преуспевающие или бедствующие, но сохраняющие «благородные понятия», манеры и претензии, бедняки, именуемые в просторечии «белой швалью». В тексте романа фигурируют непременные деятели провинциальной Америки — судья, шериф, учитель, доктор, адвокат. Они олицетворяют власть, духовную и светскую, закон и дух стабильности, хотя и подвержены традиционным предрассудкам, социальным и расовым предубеждениям, подобно всем прочим обитателям Мейкомба.		https://loveread.ec/read_book.php?id=10479&p=1	2026-05-27 15:18:26.098122+05	2026-05-27 15:18:26.098122+05	all	all
13	book	Вино из одуванчиков	restreads	/uploads/reading_1779877160271_oue6xkwc.webp	Войдите в светлый мир двенадцатилетнего мальчика и проживите с ним одно лето, наполненное событиями радостными и печальными, загадочными и тревожными; лето, когда каждый день совершаются удивительные открытия, главное из которых - ты живой, ты дышишь, ты чувствуешь! "Вино из одуванчиков" Рэя Брэдбери - классическое произведение, вошедшее в золотой фонд мировой литературы.		https://loveread.ec/read_book.php?id=58&p=1	2026-05-27 15:19:20.399501+05	2026-05-27 15:19:20.399501+05	all	all
14	book	Поллианна	inspire	/uploads/reading_1779877215512_7dsxluwl.jpg	Удивительная история девочки-сироты (которую из «чувства долга» взяла к себе суровая тетка), умение которой при любых обстоятельствах радоваться жизни, видеть во всем лучшую сторону помогает не только ей самой, но и окружающим ее людям. Почти детективные повороты сюжета, психологическая точность, с которой автор создает образы, — все это неизменно привлекает к книге внимание читателей вот уже нескольких поколений.		https://loveread.ec/read_book.php?id=9430&p=1	2026-05-27 15:20:15.645132+05	2026-05-27 15:20:15.645132+05	all	all
15	book	Трое в лодке, не считая собаки	restreads	/uploads/reading_1779877277600_ililngvd.jpg	Идет время, сменяются эпохи, но читатели по-прежнему не могут оторваться от совершенно невероятной истории путешествия троих беззаботных английских джентльменов, пустившихся в плавание по Темзе вместе со своим любимцем - фокстерьером Монморанси. Забавные недоразумения, веселые коллизии и полные комизма ситуации, из которых герои выходят, неизменно сохраняя истинно британское чувство собственного достоинства, и сегодня поражают своей оригинальностью и неувядающим юмором.		https://loveread.ec/read_book.php?id=3616&p=1	2026-05-27 15:21:17.736529+05	2026-05-27 15:21:17.736529+05	all	all
16	book	Джейн Эйр	fiction	/uploads/reading_1779877329553_w10b1szo.webp	В поисках лучшей доли Джен Эйр, сирота, страдающая от притеснений родственников и школьных наставников, становится гувернанткой и начинает новую счастливую жизнь в Торнфилде. Спустя некоторое время Джен начинает понимать, что Рочестер, хозяин Торнфилда, скрывает от нее какую-то тайну.		https://loveread.ec/read_book.php?id=2024&p=1	2026-05-27 15:22:09.698671+05	2026-05-27 15:22:09.698671+05	all	all
18	article	Как справиться с тревогой? 9 способов, которые могут помочь	anxiety	/uploads/reading_1779881788483_x2gexrs1.jpeg	С чувством тревоги сталкивается каждый из нас: мы беспокоимся из-за собеседования на новую работу, плохо спим перед важным событием или не можем сосредоточиться на делах из-за навязчивых тревожных мыслей. Нашли способы, рекомендованные учёными и психологами, которые помогут справиться с этим состоянием.	Пишите о своих чувствах в дневнике\r\n\r\nЧтобы научиться управлять тревогой, её нужно услышать и принять. Такой совет даёт Ход Тамир — обладатель докторской степени по психологии, которую он получил в Международном университете Флориды. Тамир разработал специальный «тревожный» дневник с упражнениями и техниками, помогающими справиться с тревогой. \r\n\r\nДело в том, что, записывая и описывая мысли и чувства, по словам Тамира, вы изучаете свои страхи. Со временем это позволит вам бросить им вызов и скорректировать свою модель мышления. \r\n\r\nТамир создал свой дневник на основе когнитивно-поведенческой терапии, которая, в частности, применяется при работе с тревожными состояниями. \r\n\r\nСталкиваясь с ситуациями, которые заставляют вас испытывать беспокойства, задайте себе следующие вопросы: \r\n\r\nЧто произошло? Кратко и конкретно, ответьте на вопросы: кто, что и когда сделал, — опишите ситуацию, которая вас потревожила. \r\nО чём вы думали в этот момент? Постарайтесь мысленно вернуться к этой ситуации и вспомнить, какие мысли вас задевали. \r\nКакие эмоции вы испытали? Просто перечислите их, оценив интенсивность по шкале от одного до десяти. \r\nКакие паттерны вы распознали? Перечислите, что в этот момент с вами произошло: вы захотели на ком-то сорваться, у вас испортилось настроение, почувствовали себя виноватым, начали себя мысленно критиковать. \r\nЧто я могу извлечь из этой ситуации? Теперь, когда вы описали свои негативные ощущения, постарайтесь посмотреть на ситуацию под другим углом и опишите, чему она могла вас научить. Попробуйте вычленить что-нибудь позитивное. \r\n\r\nНапишите письмо \r\n\r\nПсихотерапевт Катлин Смит, специализирующаяся на системной терапии Боуэна, написала книгу «Управление тревогой». В ней она подробно разобрала все ситуации, в которых человек может сталкиваться с тревогой: это и семейные отношения, и вопросы, связанные с карьерой, и события в мире. \r\n\r\nОдна из первых и главных вещей, которую советует Катлин, — это не пытаться избавиться от тревоги, а, наоборот, подружиться с ней. Подружиться — это значит услышать её и попытаться понять, что она хочет сказать. \r\n\r\nКатлин предлагает понаблюдать за собой и фиксировать в течение дня, что именно вас мучает и тревожит. Записать всё это. А затем представить себя на месте тревоги и попытаться написать самому себе письмо от её имени. Что она хочет вам сказать? О чём предостеречь? \r\n\r\nПотом прочитать письмо и ответить.\r\n\r\n«Вы поймёте, что тревога похожа на нервного приятеля, который искренне печётся о вас. Но это не значит, что его надо во всём слушаться».\r\n\r\nКатлин Смит\r\n\r\n\r\nВстретьтесь со своими страхами\r\n\r\nТревога мешает человеку развиваться и двигаться вперёд. Она вызывает страх, который, в свою очередь, заставляет откладывать то, чего вы действительно хотите. Доктор-психотерапевт Сет Гиллихан, практикующий когнитивно-поведенческую терапию, утверждает: чтобы научиться чему-то новому, человеку нужно встретиться со своими страхами лицом к лицу и преодолеть их. И чем чаще он будет с ними встречаться, тем менее значимыми они будут становиться. \r\n\r\nЧтобы встреча со страхами прошла мягко и не нарушила душевное спокойствие, Гиллихан предлагает следующую схему работы: \r\n\r\nСоздайте список ситуаций, в которых вы можете столкнуться со страхом лицом к лицу. Например, вы боитесь общества незнакомых людей. Как вы можете встретиться с этим страхом? Пойти одному в кино или на концерт любимой группы, пообедать в одиночестве в кафе недалеко от дома, прийти в незнакомый коллектив и так далее.\r\nОцените каждую из ситуаций по десятибалльной шкале. \r\nПостройте пирамиду: самые стрессовые ситуации наверху, все остальные по убыванию — внизу. \r\nСознательно создавайте себе эти стрессовые ситуации. Спокойно, шаг за шагом, с самого лёгкого пункта постепенно продвигайтесь вверх. Выполняйте каждое действие до тех пор, пока оно не перестанет казаться таким уж сложным. \r\nСделайте дела плохо \r\nОливия Ремес — исследовательница из Кембриджского университета, специализирующаяся на стрессе, выступает с лекциями о том, как бороться с тревогой. И вот её совет — попробуйте сделать дела плохо. Как ни странно, это поможет вам почувствовать контроль над своей жизнью. \r\n\r\nИз-за тревоги и страха сделать что-то неидеально вам может казаться, что у вас нет нужных навыков, чтобы заниматься тем, чем вы действительно хотите. И вот когда вы их приобретёте, тогда можно и начинать. \r\n\r\nВ итоге вы потратите часы, дни, годы на обдумывание стратегии, как достичь лучшего результата, и так никогда и не приступите к делу. \r\n\r\nНо! Когда вы начнёте делать хоть что-то, пусть и не так идеально, как вам хотелось бы, вы почувствуете себя увереннее — запустите мыслительный процесс и креативность.\r\n\r\n«Так будет проще не только начать, но и довести дело до конца. А оглянувшись назад, вы, скорее всего, обнаружите, что всё не так уж и плохо». \r\n\r\nОливия Ремес\r\n\r\nОтноситесь к себе как к любимому человеку \r\nЕщё один совет от Оливии. \r\n\r\nСамые важные отношения в вашей жизни — это отношения с самим собой. И если вы будете жить и делать что-то исходя из любви к самому себе, вам будет легче справиться с тревожными состояниями. \r\n\r\nЛюбовь к себе — это не только делать что-то себе во благо, но ещё и умение прощать самого себя. \r\n\r\nЭто может быть сложно — перестать ругать себя за ошибки. Например, вам кажется, что при общении с новым знакомым вы сморозили глупость или что если бы вы, ещё учась в университете, начали подрабатывать, то сейчас было бы проще строить карьеру. \r\n\r\nНо подумайте, кто ещё кроме вас самих всегда будет на вашей стороне и будет вас поддерживать? Научитесь прощать себя, отпускать ситуацию и сострадать самому себе. По словам Оливии, это станет значительным шагом на пути к борьбе с тревожностью. \r\n\r\nЛюбовь к себе как способ борьбы с тревогой пропагандирует и терапевт Тим Бокс, у которого в юности диагностировали тревожное расстройство, а сейчас он помогает людям с ним справляться. Он уверен, что доброта к себе может стать одним из шагов, помогающих подружиться со своей тревогой и научиться с ней жить. \r\n\r\nНаучитесь правильно дышать \r\nПсихолог Таня Петерсон уверена, что у вас уже есть одна важная вещь, которая может справиться с тревогой. Ваше дыхание. \r\n\r\nКогда вы чувствуете напряжение и тревожное состояние, отложите все дела и обратите внимание на дыхание. Положите руку на грудную клетку. Медленно вдохните, считая про себя. Постарайтесь вдыхать как можно дольше. Задержите дыхание. И так же медленно выдохните. Повторите несколько раз. Такой способ дыхания называется осознанным. Таня советует сделать его ежедневной практикой. \r\n\r\nЗа дыхательные практики выступает и доктор Бал Пава, которая предлагает заниматься ими два раза в день — утром и вечером. А ещё освоить техники медитации — это тоже позволяет снизить уровень тревоги. \r\n\r\nОтпустите мышечное напряжение\r\n\r\nЕщё один совет Тани Петерсон — постараться расслабиться, как только почувствуете сильный приступ тревоги. Для этого она предлагает сделать упражнение, которое поможет отпустить мышечное напряжение. Его прелесть заключается в том, что упражнение можно сделать в любом месте незаметно для окружающих: хоть в офисе, хоть в метро, хоть в автомобильной пробке. \r\n\r\nНачните со ступней. Пошевелите пальцами. Попробуйте сжать их несколько раз. Повращайте лодыжками. \r\nПереведите внимание на икры: несколько раз напрягите и расслабьте мышцы. \r\nПостепенно передвигайтесь вверх по телу, обращая внимание, в каких местах чувствуется зажатость. При этом не забывайте глубоко дышать. \r\nКогда дойдёте до головы, начните двигаться в обратном направлении, представляя, как ваше тело расслабляется, а напряжение уходит. \r\nЗаведите ежедневные ритуалы \r\nДимитрис Ксигалатас, учёный из Коннектикутского университета, занимается изучением ритуалов и того, как они влияют на здоровье человека. Он вместе с командой провёл исследование и выяснил, что они помогают проще относиться к ситуациям, которые вызывают тревожность. \r\n\r\nРитуалы, неважно какие — ежедневное чтение книги перед завтраком, поход в церковь или йога по вечерам, — снижают уровень беспокойства. Они обеспечивают мозгу ощущение регулярности и предсказуемости. У человека формируется чувство контроля над ситуацией.\r\n\r\nТаня Петерсон тоже советует обратиться к ритуалам. Особенно, к утренним: то, как человек начинает день, может повлиять на то, как он сложится в целом. \r\n\r\nСамое сложное, когда вы во власти тревоги, — встать с кровати. Придумайте ритуалы, которые облегчат ваш подъём. Вот что советует Таня: \r\n\r\nБеспорядок может повысить уровень стресса, поэтому лучше просыпаться в чистой комнате. Сделайте накануне вечером уборку. \r\nНачинайте день со стакана воды. Ещё до того, как вы встали с кровати или почистили зубы, выпейте воды, посидите немного и только потом поднимайтесь. \r\nУделите несколько минут осознанному дыханию в тишине.\r\n\r\nЗапишитесь в кружок \r\nЗа социализацию как за инструмент борьбы с тревожностью выступают многие специалисты, в том числе и Катлин Смит, и Таня Петерсон. По мнению Петерсон, когда человек записывается в кружок, он тренирует осознанность и уверенность в себе. Он чувствует полноценность жизни. А также учится чему-то новому, из-за чего тревога уходит на второй план, а следовательно, освобождается место для новых эмоций. \r\n\r\nСамое страшное и трудное — сделать первый шаг и прийти на новое занятие. Но как только вы преодолеете этот этап и сделаете походы на занятия регулярными, ваша социальная тревожность снизится, а вы сами — раскрепоститесь. \r\n\r\nМожно записаться на уроки рисования, пойти на танцы, заняться групповым изучением иностранного языка или каждые выходные начать ходить в киноклуб — подумайте о том, что вам интересно. Можно начать с онлайн-занятий — например, записаться в книжный клуб, групповые занятия по йоге или учить английский язык в тандеме.	https://burninghut.ru/kak-spravitsya-s-trevogoj/	2026-05-27 16:36:28.70475+05	2026-05-27 16:36:28.70475+05	all	all
19	article	Как отдыхать без чувства вины?	rest	/uploads/reading_1779881988218_tfqejjv1.jpg	Сейчас, в период повышенной нагрузки, связанной с подготовкой к сессии очень важно не забывать об отдыхе. Но как быть, если каждый раз, когда хочется отдохнуть, Вас мучает чувство вины?	Пересмотрите временной контекст.\r\n\r\nМногие, кто склонен ругать себя за отдых, неверно оценивают контекст «свободного времени». Их мучает мысль о том, что время на отдых они могли бы проводить с большей пользой, выполняя в это время запланированные задачи. Таким образом, они склонны рассматривать все своё свободное время как время для созидания, при этом игнорируя свою потребность в отдыхе совсем.\r\n\r\nНа самом же деле, все своё время необходимо разделять на время созидания и отдыха, поскольку во время отдыха мы наполняемся ресурсом для дальнейших достижений.\r\n\r\nЭто подобно машине, которую необходимо сначала заправить, а только потом она может ехать! Мы просто воруем у себя возможность полноценно двигаться, лишая себя времени на наполнение энергией! Хотя изначально кажется, что, наоборот, отдых забирает наше время на развитие.\r\n\r\n\r\nИзучите свои чувства.\r\n\r\nДругим аспектом этого вопроса являются, несомненно, чувства, связанные с темой отдыха.\r\n\r\n\r\n\r\nКак было принято отдыхать в вашей семье?\r\nБыла ли возможность безопасно расслабиться в кругу близких?\r\nС чем конкретно связана у вас тема отдыха?\r\n\r\nЕсли честно ответить на эти вопросы, некоторые из вас могут обнаружить, что отдых был связан не с тем, что нравится и реально восстанавливает силы, а просто со сменой деятельности. Например, с трудом на даче, который забирал остатки и сил, и сейчас бессознательно вы уклоняетесь от всего, что попадает под понимание такого «отдыха».\r\n\r\nСейчас, будучи взрослым, вы уже можете осознанно выбирать то, что вам нравится и как именно Вы предпочитаете проводить своё свободное время.\r\n\r\n\r\nДоверьтесь природе.\r\n\r\nВ природе все подвержено циклам - есть день и ночь, зима и лето, закат и рассвет. Есть время для активности, а есть для восстановления сил. Следовать за этой схемой — значит быть в гармонии с ритмами жизни! Попробуйте сделать глубокий вдох, и совсем не выдыхать — так просто невозможно долго существовать, поэтому пересмотрите своё отношение к процессу восстановления - дайте себе выдохнуть, наконец, во всех смыслах!\r\n\r\n\r\nОсознайте свой страх « не успеть».\r\n\r\nВ английском языке недавно появилась аббревиатура «FOMO», которая расшифровывается как «fear of missing out» — страх остаться в стороне, пропустить что-то важное.\r\n\r\nВысокий ритм жизни задаёт высокие планки, и есть страх, что если мы остановимся, то потеряем возможности, но парадокс заключается в том, что если мы не останавливаемся — мы пропускаем само ощущение жизни, забывая наслаждаться простыми моментами, пребывая всегда в погоне за чем-то лучшим.\r\n\r\n\r\nРазрешите себе отдых!\r\n\r\nВсе мы родом из детства и, конечно, впитываем родительские предписания, которые влияют на всю нашу жизнь. И если родители не уделяли внимания тому, как ребенок восстанавливает свои силы, во взрослом состоянии у нас с этим тоже буду проблемы.\r\n\r\nСтаньте себе заботливым и любящем родителем и разрешите себе то, в чем вы по-настоящему нуждаетесь — придумайте, запланируйте, организуйте себе лучший отдых, тот, о котором давно мечтали, ведь Вы это заслуживаете!\r\n\r\n\r\nПриучайте себя постепенно!\r\n\r\nБывает сложно сразу выделить себе много времени на полноценный отдых, попробуйте начать с малого и разрешите себе для начала, например, каждый час встать из-за компьютера и походить немного, размяться и подышать пару минут. За день эти пару минут сложатся в четверть часа, которые вы потратили на отдых и восстановление сил.\r\n\r\n\r\nНайдите единомышленников!\r\n\r\nЕсли вы сами можете забыть про то, что вам необходимо время для расслабления, найдите того, у кого нет этих проблем, либо друга или подругу, с кем вам комфортно проводить время и с кем легче всего настроиться на отдых.\r\n\r\nТакже это может быть ваш любимый питомец — он то точно вытащит вас на прогулку минимум два раза в день, где вы сможете просто погулять и подышать свежим воздухом.\r\n\r\n\r\nПоставьте будильник!\r\n\r\nАбсолютно серьезно, внесите отдых в расписание ваших дел на день, пусть часы работы чередуются с паузами для расслабления. Чтобы не войти в привычный паттерн «забывания», поставьте будильник - пусть он каждый раз торжественно напоминает Вам, что время отдыха пришло!\r\n\r\n\r\nИ главное, не забывайте относиться к себе с любовью и заботой, тогда никакие ваши потребности не останутся в стороне!	https://mgsu.ru/pc/51552/	2026-05-27 16:39:48.353626+05	2026-05-27 16:39:48.353626+05	all	all
20	article	Ничего не хочется. Вообще ничего. Что с этим делать?	emotions	/uploads/reading_1779882367806_e5xv1ha1.jpg	Чувство, что жизнь стала пресная и не несет открытий, знакомо многим. Это может быть как сезонная реакция, так и внутренний кризис, проблемы с мотивацией и самопоощрением. Разбираемся, в чем причина и что поможет вновь чего-то искренне захотеть.	Содержание:\r\n\r\nПереутомление\r\nМного событий\r\nОкружение\r\nПерспективы\r\nНе хвалите себя\r\nНе умеете ничего не хотеть\r\n\r\n1. У вас переутомление\r\nЧто делать: учиться отдыхать и распределять внутренние ресурсы.\r\nОдна из самых популярных причин апатии — не лень, как об этом любят рассуждать, а хроническая усталость и переутомление, на которые мы просто перестали обращать внимание. Если вы привыкли регулярно недосыпать (то есть спать меньше семи часов в день), всегда быть на связи по работе, давно не брали отпуск (или проводите его, по сути, не отдыхая, а угождая другим), почти не двигаетесь, то вы переутомились уже давно. А отсутствие отдыха лишает наш мозг критического мышления и не позволяет видеть вещи в перспективе. Действительно, как находить мотивацию на движение дальше, если вы не даете себе никакого регулярного поощрения? Просто отдых важен для нашей мотивации не меньше, чем привычная зарплата, подарки самим себе, вкусная еда и комфортный уровень жизни.\r\n\r\nНашему воспитанию свойственно превозносить трудоголизм, и многих из нас вообще не учили правильно отдыхать: часто отдых связывают с потерей контроля и упущенными возможностями стать лучше и сделать больше. Отдыхать, как и работать, часто надо учиться во взрослом возрасте — и любое обучение должно протекать постепенно. Чтобы перемены не наступили слишком резко, попробуйте разделить план долгожданного отдыха по неделям.\r\n\r\nВ первую неделю главным образом восстановите сон — верните себе всеми способами необходимые семь часов сна (и даже больше) за счет других, менее срочных дел. Для эксперимента можно подвинуть давние хобби, общение и привычку начинать день с чтения почты и мессенджеров. Проследите свое настроение после этой недели — достаточное количество сна обычно возвращает оптимистичный взгляд на вещи.\r\n\r\nВ следующую неделю, сохраняя новую привычку со сном, ограничьте свое рабочее время — заведите внутри себя распорядок и часы, когда вы не отвлекаетесь на рабочие вопросы (а откладываете их до собственно рабочего дня).\r\n\r\nВ третью неделю регламентируйте выходные: четкая рабочая неделя и два дня отдыха, в которые вы делаете только приятные вам вещи (разумеется, по возможности).\r\n\r\nВ четвертую неделю посчитайте, каким количеством времени вы располагаете, если сон или работу вынести за скобки, и на что уходит это время: сколько вы тратите времени на дорогу, сколько на быт, сколько на общение, образование, помощь близким. Цифры за эти три недели наглядно покажут вам, в чем причина постоянного переутомления, а фиксированный сон и рабочие часы помогут справедливо расставить приоритеты и реалистично относиться к собственным ресурсам.\r\n\r\n<img src="/uploads/reading_body_1779882277961_yu1r1evu.jpg" alt="" class="article-inline-img" />\r\n\r\n2. У вас забит календарь\r\nЧто делать: выделить необходимое время только на себя и не измерять жизнь эффективностью.\r\n\r\nЭтот пункт перекликается с предыдущим, но не дублирует его. Очень часто наш ежедневник забит «любимыми» делами и занятиями, в которых мы обязательно достигаем успехов, радуемся победам и живем полной жизнью: утро начинается с пробежки, день продолжается на любимой работе, вечер мы проводим с семьей, ночью смотрим новинки кино, читаем важные книги и общаемся с друзьями. Между этим ходим на встречи, выбираемся на ужины с коллегами, навещаем родителей и ездим в командировки, берем уроки в автошколе и учим иностранные языки.\r\n\r\nТакая жизнь может хорошо смотреться в ежедневнике и инстаграме, но, скорее всего, изматывает психологически. Нельзя быть на высоте 24/7, читать только полезные книги, успевать помогать всем, слушать аудиокурсы в пробке, играть с детьми в развивающие игры и готовить лучшие на свете ужины. Вернее, можно — какое-то время, пока не перестанет хотеться делать что бы то ни было. Даже любимые дела в забитом наглухо календаре перестают радовать, и единственным вариантом остаются импровизация и время на себя.\r\n\r\nТут, как и в первом пункте, стоит действовать поступательно. По списку приоритетов освободить ближайшую неделю от дел, не сделав которые вы точно никого не подведете. Посмотрите, сколько свободного времени у вас появляется и достаточно ли вам его. Ничего не планируйте и действуйте по ситуации. Если в эти пару часов хочется прогуляться — смело идите на свежий воздух. Позаботиться о себе — пожалуйста. Позвонить друзьям — да. Почитать книгу — конечно. Главное — не планируйте читать книгу, звонить друзьям и гулять за несколько часов до, дайте себе время ощутить этот природный импульс к конкретному, а не привычному занятию. А самое главное — если никаких желаний нет, наградите себя роскошью просто лежать и плевать в потолок. Возможно, именно эти полчаса за последний год доставят вам больше всего радости и вы поймете, что очень недооценивали восстанавливающую силу самого банального безделья.\r\n\r\n<img src="/uploads/reading_body_1779882295980_ovxrc22l.jpg" alt="" class="article-inline-img" />\r\n\r\n3. У вас сложное окружение\r\nЧто делать: дистанцироваться от тяжелых людей или четко прочертить границы ваших интересов.\r\n\r\nОчень трудно поддерживать в себе мотивацию, когда ваше привычное окружение вас не вдохновляет. Мы недооцениваем важность поддержки близких, настроение коллектива и внимание знакомых в нашей ежедневной жизни: если наши усилия принимают как должное, а от людей вокруг не дождаться похвалы, даже любимые обязанности исполнять очень трудно. Именно поэтому, если в вашей жизни вопрос дефицита свободы (то есть пункт 1 и 2) решен, нужно обратить внимание на людей, с которыми вы проводите больше всего времени. Для начала проанализируйте, как вы ощущаете себя дома, хотите ли вы туда возвращаться и какие эмоции вы чаще всего испытываете с домочадцами. Вы живете одна или с кем-то? Как и когда сложилась эта ситуация? Подбадривают, берегут ли вас самые близкие люди? Находят ли оно хорошее в вашей ежедневной жизни? Ценят ли ваши поступки и достижения? Удается ли им подбодрить вас в трудной ситуации?\r\n\r\nОчень часто люди, живущие вместе, теряют границы и начинают относиться ко второму человеку как к самому собой разумеющемуся, будь это дочь, мама, жена или девушка, и быть в такой роли функции очень неприятно. Проследите, после общения с какими людьми вам часто становится хуже и регулярно ли это общение.\r\n\r\nКак устроено ваше окружение на работе? У вас сложившийся коллектив или каждый тянет одеяло на себя? Вы имеете право на ошибку? Подумайте, какими людьми вы окружены в целом и дают ли они вам необходимые настроение, вдохновение, энергию. Если вам давно неинтересно в вашем кругу, если вы устали в паре или в рабочем коллективе, но эти отношения определяют треть-половину вашего времени, совсем неудивительно, что в какой-то момент вам не будет хотеться ничего, кроме одиночества и ничегонеделания.\r\n\r\n4. Вы перестали видеть перспективу\r\nЧто делать: получить мнение со стороны и найти новые причины двигаться дальше.\r\n\r\nЕжедневное повторение одних и тех же действий точит нашу мотивацию, даже если мы занимаемся любимым делом и общаемся с приятными людьми. «Ничего не хочется» — очень часто следствие того, что вы запутались, куда вас ведут конкретные отношения, дела и люди, или верное ощущение, что прошлые мотивации перестали работать. Так часто бывает, когда мы перерастаем навязанные извне цели. Например, работаем на работе, которую хотели для нас родители, а не мы сами. Или на которую согласились второпях несколько лет назад. Продолжаем отношения, в которых давно не происходит ничего интересного. Решаем материальные вопросы и откладываем ежедневные радости жизни. Имеем стратегический план, который не вдохновляет, и исполняем его от месяца к месяцу. В одиночку тянем большое семейное дело или нескольких членов семьи, не получая при этом ни удовольствия, ни благодарности. Мотивация уходит, ваш глаз замылен, ваш выбор кажется ошибочным, а новый вы пока сделать не в состоянии — нет необходимой дистанции, чтобы отделить себя от жизненных обстоятельств.\r\n\r\nВ этой ситуации есть опасность принять чужую точку зрения как свою собственную. Вместо совета попросите у людей, которых любите и которым доверяете, взгляд со стороны. Пусть они опишут ваши лучшие качества и большие достижения, озвучат ваш прогресс за последние несколько лет. Пусть они скажут, какие ваши сильные стороны привлекают больше всего, выделят ваши явные особенности, озвучат важные этапы вашего пути. Совершенно необязательно брать все замечания на карандаш, но в случае долгого замешательства взгляд со стороны (особенно если с вами откровенно говорят несколько человек) поможет вернуть утраченную почву под ногами и ощущение собственной ценности.\r\n\r\nНе бойтесь признаться, что прежние цели вас больше не привлекают. Нет ничего страшного в том, чтобы сказать «Я не хочу свое дело, я хочу работать на кого-то», или «Мне пора выходить из этих отношений», или «Я выбрала не ту работу», или «Это жилье мне не по карману». Сместив фокус на свои плюсы, которые признают окружающие, вы, скорее всего, найдете импульс на действия в новом направлении. И даже наблюдение за собой вместо отрицания неудовлетворенности будет важным шагом к чему-то новому.\r\n\r\n<img src="/uploads/reading_body_1779882320455_xmv332a9.jpg" alt="" class="article-inline-img" />\r\n5. Вы не умеете себя хвалить\r\nЧто делать: учиться замечать ежедневные победы и награждать себя за усилия.\r\n\r\nОчень распространенная воспитательная проблема — хвалить за оценки и недооценивать усилия — плохо сказывается на самочувствии и самовосприятии уже взрослого человека. Кажется, дела сделаны, галочки в списке важного поставлены, но волнует вас на самом деле только напряжение следующего дня. У вас не получается выдохнуть и внутренне похлопать себя по плечу, вы преуменьшаете свои заслуги и ориентируетесь на благодарности и замечания других (а люди не так склонны хвалить и подбадривать друг друга в подходящий момент), все результаты кажутся недостаточными. Перспектива искажается: каждый новый день несет только новый список дел, которые нужно выполнить, и никто не скажет за это спасибо. Выход — приучаться хвалить себя по мелочам. Это будет казаться очень противоестественным вначале, но вам необходимо учиться замечать свои достижения самостоятельно и останавливать внутреннего критика, а то и тирана.\r\n\r\nПодумайте, какое количество дел вы делаете, условно говоря, по списку, а какое — автоматически. Разве то, что вы делаете что-то на автомате, означает, что это неважные дела? Навести порядок, приготовить вкусный завтрак, поздравить друзей с праздниками, сделать зарядку, поухаживать за собой и другими, проверить домашнее задание ребенка, заехать в гости к родителям, полить цветы и покормить кота — да, именно эти пустяки отъедают часто так много времени. Добавьте к этому ежедневные дела на работе и количество новых знаний и контактов, которые вы каждый день получаете, просто хорошо делая свое дело.\r\n\r\nЧасто к этому количеству дел прилагается учеба, помощь другим, воспитание детей, благотворительность, организация событий — и это уже по-настоящему огромный вклад, который пора замечать и считаться с потраченными усилиями. Распишите вашу неделю по результатам сделанных больших и как будто бы незначительных дел, вспомните все, что не было бы сделано без вас, и всех, кому вы помогли. Такой список наглядно покажет, как часто вам стоит признавать свои заслуги и улыбаться собственному отражению за большие усилия.\r\n\r\n6. Вы не умеете ничего не хотеть\r\nЧто делать: пресекать обвинения в отсутствии желаний.\r\n\r\nБездетным людям рассказывают, что им надо иметь детей. Людям не в отношениях внушают, что им необходимы отношения. Людям со скромным доходом объясняют, что они должны зарабатывать больше. Взрослым говорят, что надо беречь молодость. Молодым — что надо взрослеть как можно скорее. Нам кругом навязывают желания, которые имеют очень мало общего с нашими характерами, темпераментами и планами. Вопрос «Что вы хотите?» звучит и в магазине, и на приеме у терапевта, и на собеседовании на работу, и в разговоре с друзьями. А можно вообще ничего не хотеть. Разумеется, временно — человек иначе не может. Но совершенно нормально ничего не хотеть в данный момент времени, не страдать от ощущения неполноценности и ни перед кем за это не оправдываться.\r\n\r\nВспомните все навязанные вам желания и проследите, проживаете ли вы их в настоящем. Многое ли вокруг продиктовано именно вашей мотивацией, или большинство из этого является компромиссом между вашим желанием и чьим-то еще? Позволяли ли вы себе когда-нибудь вообще ничего не хотеть? Попробуйте сосредоточиться на небольших событиях каждого дня и отследить эмоции по отношению к ним. Не стройте долгосрочных планов, от которых не перехватывает дыхание. Попробуйте говорить «нет» по необязательным поводам хотя бы несколько недель. Оградите себя от стороннего влияния, в том числе непрошеных советов из лучших побуждений. Соглашайтесь на достаточное и не отвлекайтесь от главной задачи — не винить себя за то, что вам не хочется чего-то большего. Замечайте, без чего невозможен ваш ежедневный комфорт, а чем можно поступиться. Посмотрите, какое количество вещей, контактов, дел описывает удобную для вас жизнь. Попробуйте делать минимум и проследите свои ощущения от этого. Когда внутри отрегулируются параметры необходимого и достаточного, настоящие желания не заставят себя долго ждать. \r\n\r\nАвторы\r\nАлиса Таежная	https://style.rbc.ru/health/5c87be7a9a79473cff66cc84	2026-05-27 16:46:08.055128+05	2026-05-27 16:46:08.055128+05	all	all
21	article	Почему сравнивать себя с другими людьми невыгодно	emotions	/uploads/reading_1779882598162_6u9cjsex.jpg	Если вы часто сравниваете себя с другими людьми и получаете результат не в свою пользу, думаю, вам будет полезна данная статья.	Объектами для сравнения могут быть кто угодно: новая девушка вашего бывшего партнера, коллега на работе, подруга или друг, и даже лично незнакомый вам блогер.\r\n\r\nВ большинстве случаев, сравнивая себя с другими людьми, данное сравнение получается не в вашу пользу. Вы расстраиваетесь, у вас снижается настроение и тем самым вы загоняете себя в ловушку.\r\n\r\nВы можете наблюдать лишь идеальную картинку, но не знаете, что за ней стоит. \r\nМне вспомнилось видео, в котором повествовалось о том, что раскрученные блогеры часто арендуют пакеты из люксовых магазинов для того, чтобы представить себя в лучшем свете. Их цель - продать определенный продукт. Конечно, возможен и такой вариант, когда знаменитая в социальных сетях личность отдыхает на дорогом курорте, но вы не видите то, сколько сил и труда она вкладывает в раскрутку своего личного бренда.\r\n\r\nСравнивая себя с другими, заведомо мы сравниваем свои худшие черты с лучшими чертами другого человека. Тем самым мы принижаем себя и искусственно завышая значимость другого.\r\nУ каждого свой пусть и скорость развития.\r\nВозможно, кто-то схватывает быстро, а кому-то требуется больше усилий. Но это не значит, что ваш продукт хуже. Например, у одного друга хорошо получается открывать новый бизнес и вкладываться в инновационные идеи, а другой, в большей степени ориентирован на науку. Вероятно всего, что и тот и другой через определенное время добьются больших результатов, но идти к ним они будут разыми путями.\r\n\r\nВсегда будет кто-то, кто лучше вас.\r\nБыстрее вас, красивее, умнее, общительнее и т.д. Возможно, в данном случае поможет понимание того, что один человек не может быть развит в различных сферах одновременно. Тут важно оценить свои внутренние ресурсы реально, сконцентрироваться на том, что получается лучше всего либо на своих положительных качествах, а также параллельно с этим развивать то, что требует проработки.\r\n\r\nКогда вы сравниваете себя с другими людьми, вы перемещаете фокус внимания с того, что важно для вас, на ценности другого человека.\r\nЕсли вы поймали себя на подобном поведении, спросите себя честно о том, действительно ли вы этого хотите, или вы хотите только потому, что это есть у другого человека.\r\n\r\nКогда вы сравниваете себя с другими, вы тратите время, которое могли бы вложить в себя, на другого человека.\r\nВы думаете о нем; вы проявляете эмоции; возможно даже вместо того, чтобы сконцентрироваться на своих целях и задачах, все внимание вы смещаете на жизнь другого человека.\r\n\r\nУ вас и у другого человека первоначально могут быть разные условия.\r\nДа, такова жизнь, но это не значит, что идя по своему пути и прислушиваясь к себе, вы не добьетесь хороших результатов. \r\n\r\nЕсли ваше поведение похоже на то, что я описала в одном из пунктов, подумайте о том, что заставляет вас сравнивать себя с другим человеком. Это может быть зависть; нежелание решать собственные проблемы и задачи, переключая внимание на другого; инфантильная позиция, а также родительные директивы или негативные установки, которые мешают поверить в свои силы.	https://www.b17.ru/article/pochemu_sravnivat_sebya_s_drugimi_lyudmi_nevygodno/	2026-05-27 16:49:58.393776+05	2026-05-27 16:49:58.393776+05	all	all
22	article	Когда продуктивность становится токсичной и как вернуться к нормальному состоянию	motivation	/uploads/reading_1779883066983_j5xqf3lf.jpeg		В 2019 году ВОЗ внесла профессиональное выгорание в Международный классификатор болезней (МКБ‑11). Казалось бы, точка поставлена. Теперь это официальная позиция доказательной медицины: переработки, жёсткие дедлайны и привычка брать дела на дом вредны для физического и психического здоровья.\r\n\r\nОднако миллионы людей по‑прежнему попадают в одну и ту же ловушку: они «не выключаются» из рабочего процесса в конце дня, продолжая трудиться даже на выходных и в отпуске.\r\n\r\nНа первый взгляд, такие сотрудники невероятно продуктивны. Они могут ответить на рабочий имейл или внести пару правок в проект, пока стоят в пробке или очереди. Да что там, даже на свидании можно услышать: «Минутку, я только отвечу на срочное письмо!»\r\n\r\nРаботодатели нередко поощряют такое поведение. Но на самом деле от него страдают все.\r\n\r\nЧто такое токсичная продуктивность и откуда она берётся\r\nТоксичная продуктивность — это потребность всегда оставаться эффективным, «быть на связи», причём неважно, какой ценой.\r\n\r\nТакое поведение не ново. В профессиональном мире уже давно идёт соревнование, кто может делать больше и спать меньше. Психологи даже называют это явление «культурой суеты». \r\n\r\nНеслучайно в соцсетях можно увидеть посты вроде: «Уехал из офиса в полночь. Завтра такой же насыщенный и увлекательный день». Причина для подобного отношения связана с устоявшимся представлением, что чем больше работаешь и самосовершенствуешься, тем ты лучше. Девизом такого подхода можно считать знаменитый твит Илона Маска: «Никто никогда не менял мир за 40 часов в неделю».\r\n\r\nВ пандемию погоня за продуктивностью только обострилась. Удалёнка окончательно стёрла границы между работой и отдыхом, и теперь люди стремятся быть на связи ещё активнее, чем раньше.\r\n\r\nОдин пытается таким образом показать, что действительно много работает, а не бегает в супермаркет и не занимается бытовыми делами в течение дня. Для второго это способ компенсировать отсутствие в офисе. А третьему хочется продемонстрировать, что он самый надёжный и эффективный сотрудник в любых условиях.\r\n\r\nДля таких людей работа становится важнее всего остального. И «культура суеты» иногда действительно помогает им получить повышение или признание. Однако у этой продуктивности есть и тёмная сторона.\r\n\r\nПочему такая продуктивность всё-таки токсична\r\nКлинический психотерапевт Крути Квази выделила сразу несколько физических и психических проблем, с которыми обязательно столкнётся каждый человек, увлёкшийся «культурой суеты».\r\n\r\n1. Постоянная неудовлетворённость\r\n«Я мог бы сделать больше» — эта навязчивая мысль преследует любого человека, скатившегося в токсичную продуктивность. Действительно, ведь под рукой всё время телефон или ноутбук. А значит, можно ответить на ещё одно письмо, внести ещё пару правок, доработать тот текст и досмотреть ту лекцию о мотивации. И этот список бесконечен.\r\n\r\nВ результате к концу дня человек валится с ног, но всё равно считает, что постарался недостаточно. Можно было бы быть активнее. Продуктивнее. Успешнее.\r\n\r\n2. Тревожность\r\nТаким людям свойственно всё время сомневаться в себе и думать, что они сделали недостаточно. А значит, считать, что они не так профессиональны, как хотелось бы, и вообще не на своём месте. В результате может развиться синдром самозванца. Его следствие — постоянные беспокойство и тревожность, вызванные страхом «разоблачения» и увольнения.\r\n\r\n3. Падение самооценки\r\nЧеловек с токсичной продуктивностью связывает самооценку с количеством часов, посвящённых работе. Хорошенько потрудился, ни минуты не сидел без дела — молодец! «Мог бы и лучше…» — ленивый неудачник.\r\n\r\n4. Проблемы в личных отношениях\r\nОбщение с родными и друзьями отнимает время. А его при токсичной продуктивности катастрофически не хватает. В результате человек становится нетерпеливым и даже нетерпимым, избегает «бессмысленных» разговоров по душам и встреч, что приводит к закономерным трудностям в отношениях.\r\n\r\n5. Проблемы со здоровьем\r\nРабочие задачи при токсичной продуктивности кажутся более важными, чем сон, отдых, прогулки, физические упражнения. С очевидными последствиями: это и хронический стресс, и геморрой, и сердечно‑сосудистые проблемы, и другие нарушения, связанные с малоподвижным, социально замкнутым и очень нервным образом жизни.\r\n6. Снижение продуктивности и мотивации\r\nТоксичная продуктивность рано или поздно перерастает в эмоциональное выгорание и депрессию. Человек, ранее когда‑то горевший работой, начинает быстро уставать и выполнять свои обязанности на автомате — на большее не хватает сил.\r\n\r\nПочему токсичная продуктивность сотрудника вредит работодателю\r\nФормула незамысловатая. Сотрудник, страдающий от токсичной продуктивности, подведёт руководителя в самый неожиданный момент. Не по злому умыслу. Просто у человека, который не отдыхает и не имеет возможности восстановиться, однажды заканчивается энергия — и он «выключается», как игрушка с севшей батарейкой.\r\n\r\nКак справиться с токсичной продуктивностью\r\nЧтобы эффективно работать, приходится на время забыть о личных отношениях, бытовых проблемах, хобби. Точно так же, чтобы продуктивно жить — отдыхать, восстанавливать силы, общаться, гулять, тренироваться — нужно научиться забывать о работе.\r\n\r\nЕдинственный способ вырваться из ловушки токсичной продуктивности — установить грамотный баланс между работой и жизнью.\r\n\r\nВот как рекомендуют действовать психологи.\r\n1. Обсудите ситуацию с работодателем\r\nВаш начальник наверняка в курсе, насколько важна возможность восстановиться. Обсудите с ним изменения, которые планируете внести в свою жизнь.\r\n\r\nНапример, сообщите, что теперь не будете на связи в выходные и после семи часов вечера. Если чувствуете, что совсем измотаны, — попросите внеплановый отпуск (и, конечно же, не вздумайте работать во время него).\r\n\r\n2. Запланируйте перерывы в работе\r\nИменно так — внесите их в свой график. Например, обозначьте, что у вас есть 10–15 минут свободного времени после каждой важной встречи или завершённого этапа работ.\r\n\r\nПрогуляйтесь, подышите свежим воздухом, сделайте небольшую разминку, попейте воды, послушайте музыку, помедитируйте. Или хотя бы просто посмотрите в окно, а не в монитор или документы.\r\n\r\n3. В выходные отдыхайте\r\nНикаких телефонов, срочных писем и деловых встреч. Чтобы восстановить силы, нужно полностью отключиться от работы.\r\n\r\n4. Установите границы, которые будут определять ваш образ жизни\r\nНапример, договоритесь с собой:\r\n\r\nспать не менее 7 часов в сутки, для этого можно, например, ложиться в кровать не позже 11 вечера;\r\nразминаться в конце каждого рабочего часа;\r\nопределить время для общения с семьёй и друзьями, когда вы точно не будете отвлекаться на другие дела;\r\nхотя бы дважды в день нормально есть, а не перекусывать на бегу.\r\n\r\n5. Постарайтесь отказаться от социальных сетей\r\nОсобенно в выходные и на время отпуска. Наблюдения за чужой приукрашенной жизнью заставляют думать: «Другие люди такие активные, не то что я». Чувство вины вызовет стресс, что точно помешает нормально отдохнуть.	https://lifehacker.ru/toksichnaya-produktivnost/	2026-05-27 16:57:47.231786+05	2026-05-27 16:57:47.231786+05	all	all
\.


--
-- Data for Name: support_request_confirmations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_request_confirmations (confirmation_id, request_id, milestone, psychologist_id, user_confirmed, notification_id, created_at, responded_at) FROM stdin;
1	5	contacted	13	f	2	2026-05-27 11:05:48.452254	2026-05-27 11:07:30.368011
\.


--
-- Data for Name: support_request_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_request_notes (note_id, request_id, psychologist_id, body, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_requests (request_id, user_id, display_name, contact, message, created_at, status, assigned_psychologist_id, assigned_at, assigned_by, whatsapp) FROM stdin;
3	11	dana	dana@dana	hhhjh	2026-05-09 20:38:27.207575	new	\N	\N	\N	\N
2	2	Aida Konyrbaeva	konyrbaevaaida624@gmail.com	ририр	2026-05-07 23:47:33.082614	contacted	13	2026-05-22 08:08:44.522718	1	\N
4	11	dana	dana@dana	мне тревожно нужна помощь	2026-05-09 20:57:33.620253	in_progress	13	2026-05-22 08:07:13.00208	1	\N
1	2	Aida Konyrbaeva	konyrbaevaaida624@gmail.com	здравствуйте мне нужно помощь	2026-05-07 01:24:09.003875	contacted	13	2026-05-24 18:18:27.484016	1	\N
5	2	Aida Konyrbaeva	konyrbaevaaida624@gmail.com	помощь	2026-05-27 10:23:08.918144	contacted	13	2026-05-27 10:23:48.712286	1	\N
\.


--
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_results (result_id, user_id, test_id, score, level, answers, created_at) FROM stdin;
1	3	5	20	Средний	{"27": 1, "28": 2, "29": 1, "30": 0, "31": 3, "32": 1, "33": 2, "34": 4, "35": 2, "36": 4}	2026-04-19 06:59:48.233163
2	5	5	26	Средний	{"27": 1, "28": 2, "29": 3, "30": 2, "31": 2, "32": 2, "33": 3, "34": 4, "35": 3, "36": 4}	2026-04-22 03:26:29.679782
3	2	3	21	Средний	{"10": 0, "11": 2, "12": 2, "13": 3, "14": 3, "15": 3, "16": 4, "17": 2, "54": 2}	2026-05-09 00:52:33.64037
4	2	5	25	Высокий	{"59": 1, "60": 4, "61": 4, "62": 3, "63": 4, "64": 3, "65": 2, "66": 2, "67": 2}	2026-05-27 17:19:28.918703
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (test_id, title, description, category_id, created_at, scoring_type, target_role, target_gender) FROM stdin;
4	MBI - Профессиональное выгорание (преподаватели)	Классическая версия MBI для педагогов.	3	2026-04-04 17:01:04.708075	likert_sum	all	all
5	Тест на рабочую перегрузку	9 вопросов по шкале от «Никогда» до «Всегда» - ориентир, не диагноз.	1	2026-04-04 17:01:04.708075	likert_sum	all	all
6	GAD-7: скрининг тревожности	Семь вопросов за последние 2 недели. Логика GAD-7; не заменяет консультацию врача.	1	2026-04-10 22:36:45.55669	gad7	all	all
7	Ежедневный чек-ин (9 вопросов)	Те же варианты ответа, что в основном опросе - для сопоставимой динамики в аналитике.	1	2026-04-19 17:21:56.819328	daily5	all	all
2	MBI - Опросник выгорания Маслах (студенты)	Адаптированная версия для студентов: эмоциональное истощение, деперсонализация, эффективность.	2	2026-04-04 17:01:04.708075	mbi_student	all	all
3	Тест на академическую усталость	Оценка усталости от учебы и мотивации.	2	2026-04-04 17:01:04.708075	likert_sum	all	all
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notifications (notification_id, user_id, type, title, body, payload, is_read, read_at, created_at) FROM stdin;
1	2	psychologist_assigned	Заявка принята	Мы получили вашу заявку и назначили психолога Махаббат. Он свяжется с вами в ближайшее время.	{"request_id": 5, "psychologist_id": 13, "psychologist_name": "Махаббат"}	t	2026-05-27 10:23:59.889175	2026-05-27 10:23:48.712286
2	2	support_verify_contacted	Психолог связался с вами	Психолог Махаббат отметил, что связался с вами. Подтвердите, пожалуйста: это так?	{"milestone": "contacted", "request_id": 5, "confirmation_id": 1}	t	2026-05-27 11:06:03.608713	2026-05-27 11:05:48.452254
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, age, email, password, role, avatar, created_at, onboarding_burnout_completed, onboarding_burnout_percent, onboarding_burnout_completed_at, daily_personalization_json, gender, space_preferences, has_completed_space_onboarding, notifications_enabled, last_name) FROM stdin;
2	Аида	21	konyrbaevaaida624@gmail.com	123456	student	/uploads/avatar_2_1779898309810.jpeg	2026-04-04 17:02:20.02121	t	50	2026-04-06 18:48:12.683546	\N	\N	{"completedAt": "2026-05-27T16:13:22.000Z", "difficulties": ["low-energy", "rest-guilt"], "emotionalNeeds": ["support", "emotional-release"], "formatPreferences": ["calm", "cozy"], "contentPreferences": ["music", "meditation", "podcasts"], "atmospherePreferences": ["minimal", "light"]}	t	t	Конырбаева
9	ada	34	ad@ada	123456	teacher	/avatars/av-teacher-woman.png	2026-05-05 21:46:32.137138	t	89	2026-05-05 21:47:10.479709	\N	girl	\N	f	t	\N
3	аида	21	konyr@gmail.com	123456	student	\N	2026-04-19 06:57:06.576046	t	83	2026-04-19 06:57:46.693494	\N	\N	\N	f	t	\N
10	ada	45	ada@ada	1234567	student	\N	2026-05-08 13:22:26.834527	f	\N	\N	\N	\N	\N	f	t	\N
5	aida	21	kon@gmail.com	123456	student	\N	2026-04-21 22:33:19.874951	t	40	2026-04-21 22:33:47.278257	\N	\N	\N	f	t	\N
11	dana	45	dana@dana	123456	teacher	/avatars/av-teacher-woman.png	2026-05-09 20:35:31.531585	t	100	2026-05-09 20:35:56.722924	\N	girl	\N	f	t	\N
6	sabina	25	sabina@gmail.com	654321	teacher	\N	2026-04-22 11:25:11.26732	t	47	2026-04-22 11:25:38.663497	\N	\N	\N	f	t	\N
7	sabrina	22	sabrina@gmail.com	qwerty	student	/uploads/avatar_7_1776840059275.png	2026-04-22 11:39:26.339498	t	53	2026-04-22 11:39:45.985775	\N	\N	\N	f	t	\N
12	sabina	45	sabi@gmail.com	123456	teacher	/avatars/av-teacher-boy.png	2026-05-09 21:02:52.633671	t	89	2026-05-09 21:03:30.833221	\N	boy	\N	f	t	\N
1	diplom	\N	admin@burnout.kz	123456	admin	/uploads/avatar_1_1776499588625.jpg	2026-04-04 17:01:04.726525	t	\N	\N	\N	\N	\N	f	t	\N
4	Администратор	\N	admin@com	123	admin	\N	2026-04-19 17:21:56.887756	t	\N	\N	\N	\N	\N	f	t	\N
8	Test	\N	test_diag@example.com	secret12	student	\N	2026-05-01 14:06:38.813282	f	\N	\N	\N	\N	\N	f	t	\N
13	Махаббат	\N	edu.krg09@gmail.com	123456	psychologist	/uploads/psych_avatar_1779418759289_2f4fa2d7.jpg	2026-05-22 07:59:20.46406	f	\N	\N	\N	\N	\N	f	t	\N
14	sana	22	sana@gmail.com	123456	student	\N	2026-05-22 11:23:33.815438	f	\N	\N	\N	\N	\N	f	t	\N
\.


--
-- Name: admin_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_admin_id_seq', 1, false);


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 4, true);


--
-- Name: diary_entries_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diary_entries_entry_id_seq', 8, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 1, true);


--
-- Name: film_collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.film_collections_collection_id_seq', 4, true);


--
-- Name: films_film_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.films_film_id_seq', 52, true);


--
-- Name: meditations_meditation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meditations_meditation_id_seq', 18, true);


--
-- Name: music_collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_collections_collection_id_seq', 771, true);


--
-- Name: music_items_music_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_items_music_id_seq', 26, true);


--
-- Name: podcast_episodes_podcast_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.podcast_episodes_podcast_id_seq', 9, true);


--
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.practice_sessions_session_id_seq', 1, false);


--
-- Name: psychologist_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.psychologist_documents_document_id_seq', 1, true);


--
-- Name: psychologist_invitations_invitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.psychologist_invitations_invitation_id_seq', 4, true);


--
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 85, true);


--
-- Name: reading_items_reading_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reading_items_reading_id_seq', 22, true);


--
-- Name: support_request_confirmations_confirmation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_request_confirmations_confirmation_id_seq', 1, true);


--
-- Name: support_request_notes_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_request_notes_note_id_seq', 1, false);


--
-- Name: support_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_requests_request_id_seq', 5, true);


--
-- Name: test_results_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_results_result_id_seq', 4, true);


--
-- Name: tests_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tests_test_id_seq', 5, true);


--
-- Name: user_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_notifications_notification_id_seq', 2, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 14, true);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (admin_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: diary_entries diary_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_pkey PRIMARY KEY (entry_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: film_collection_items film_collection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collection_items
    ADD CONSTRAINT film_collection_items_pkey PRIMARY KEY (collection_id, film_id);


--
-- Name: film_collections film_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collections
    ADD CONSTRAINT film_collections_pkey PRIMARY KEY (collection_id);


--
-- Name: film_collections film_collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collections
    ADD CONSTRAINT film_collections_slug_key UNIQUE (slug);


--
-- Name: films films_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.films
    ADD CONSTRAINT films_pkey PRIMARY KEY (film_id);


--
-- Name: meditations meditations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meditations
    ADD CONSTRAINT meditations_pkey PRIMARY KEY (meditation_id);


--
-- Name: music_collection_tracks music_collection_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collection_tracks
    ADD CONSTRAINT music_collection_tracks_pkey PRIMARY KEY (collection_id, music_id);


--
-- Name: music_collections music_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collections
    ADD CONSTRAINT music_collections_pkey PRIMARY KEY (collection_id);


--
-- Name: music_collections music_collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collections
    ADD CONSTRAINT music_collections_slug_key UNIQUE (slug);


--
-- Name: music_items music_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_items
    ADD CONSTRAINT music_items_pkey PRIMARY KEY (music_id);


--
-- Name: podcast_episodes podcast_episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.podcast_episodes
    ADD CONSTRAINT podcast_episodes_pkey PRIMARY KEY (podcast_id);


--
-- Name: practice_favorites practice_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_favorites
    ADD CONSTRAINT practice_favorites_pkey PRIMARY KEY (user_id, practice_key);


--
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: psychologist_documents psychologist_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_documents
    ADD CONSTRAINT psychologist_documents_pkey PRIMARY KEY (document_id);


--
-- Name: psychologist_invitations psychologist_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_invitations
    ADD CONSTRAINT psychologist_invitations_pkey PRIMARY KEY (invitation_id);


--
-- Name: psychologist_invitations psychologist_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_invitations
    ADD CONSTRAINT psychologist_invitations_token_key UNIQUE (token);


--
-- Name: psychologist_profiles psychologist_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_profiles
    ADD CONSTRAINT psychologist_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- Name: reading_items reading_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_items
    ADD CONSTRAINT reading_items_pkey PRIMARY KEY (reading_id);


--
-- Name: support_request_confirmations support_request_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations
    ADD CONSTRAINT support_request_confirmations_pkey PRIMARY KEY (confirmation_id);


--
-- Name: support_request_confirmations support_request_confirmations_request_id_milestone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations
    ADD CONSTRAINT support_request_confirmations_request_id_milestone_key UNIQUE (request_id, milestone);


--
-- Name: support_request_notes support_request_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_notes
    ADD CONSTRAINT support_request_notes_pkey PRIMARY KEY (note_id);


--
-- Name: support_requests support_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_pkey PRIMARY KEY (request_id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (result_id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (test_id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: events_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_created_at_idx ON public.events USING btree (created_at DESC);


--
-- Name: events_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_kind_idx ON public.events USING btree (kind);


--
-- Name: film_collection_items_coll_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX film_collection_items_coll_idx ON public.film_collection_items USING btree (collection_id, sort_order);


--
-- Name: films_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX films_created_at_idx ON public.films USING btree (created_at DESC);


--
-- Name: idx_psych_documents_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psych_documents_user ON public.psychologist_documents USING btree (user_id);


--
-- Name: idx_psych_invitations_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psych_invitations_email ON public.psychologist_invitations USING btree (lower((email)::text));


--
-- Name: idx_psych_invitations_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_psych_invitations_token ON public.psychologist_invitations USING btree (token);


--
-- Name: idx_support_confirmations_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_confirmations_request ON public.support_request_confirmations USING btree (request_id, created_at DESC);


--
-- Name: idx_support_request_notes_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_request_notes_request ON public.support_request_notes USING btree (request_id, created_at DESC);


--
-- Name: idx_support_requests_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_requests_created_at ON public.support_requests USING btree (created_at DESC);


--
-- Name: idx_support_requests_psychologist; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_requests_psychologist ON public.support_requests USING btree (assigned_psychologist_id, created_at DESC);


--
-- Name: idx_support_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_requests_status ON public.support_requests USING btree (status);


--
-- Name: idx_support_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_requests_user_id ON public.support_requests USING btree (user_id);


--
-- Name: idx_user_notifications_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user_created ON public.user_notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_user_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user_unread ON public.user_notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: meditations_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meditations_created_at_idx ON public.meditations USING btree (created_at DESC);


--
-- Name: meditations_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX meditations_kind_idx ON public.meditations USING btree (kind);


--
-- Name: music_collection_tracks_coll_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX music_collection_tracks_coll_idx ON public.music_collection_tracks USING btree (collection_id, sort_order);


--
-- Name: music_items_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX music_items_kind_idx ON public.music_items USING btree (kind);


--
-- Name: music_items_mood_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX music_items_mood_idx ON public.music_items USING btree (mood);


--
-- Name: podcast_episodes_pick_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX podcast_episodes_pick_idx ON public.podcast_episodes USING btree (is_featured_pick);


--
-- Name: podcast_episodes_topic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX podcast_episodes_topic_idx ON public.podcast_episodes USING btree (topic);


--
-- Name: reading_items_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reading_items_category_idx ON public.reading_items USING btree (category);


--
-- Name: reading_items_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reading_items_kind_idx ON public.reading_items USING btree (kind);


--
-- Name: diary_entries diary_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: film_collection_items film_collection_items_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collection_items
    ADD CONSTRAINT film_collection_items_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.film_collections(collection_id) ON DELETE CASCADE;


--
-- Name: film_collection_items film_collection_items_film_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.film_collection_items
    ADD CONSTRAINT film_collection_items_film_id_fkey FOREIGN KEY (film_id) REFERENCES public.films(film_id) ON DELETE CASCADE;


--
-- Name: music_collection_tracks music_collection_tracks_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collection_tracks
    ADD CONSTRAINT music_collection_tracks_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.music_collections(collection_id) ON DELETE CASCADE;


--
-- Name: music_collection_tracks music_collection_tracks_music_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_collection_tracks
    ADD CONSTRAINT music_collection_tracks_music_id_fkey FOREIGN KEY (music_id) REFERENCES public.music_items(music_id) ON DELETE CASCADE;


--
-- Name: practice_favorites practice_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_favorites
    ADD CONSTRAINT practice_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: practice_sessions practice_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: psychologist_documents psychologist_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_documents
    ADD CONSTRAINT psychologist_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: psychologist_invitations psychologist_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_invitations
    ADD CONSTRAINT psychologist_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: psychologist_invitations psychologist_invitations_used_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_invitations
    ADD CONSTRAINT psychologist_invitations_used_by_user_id_fkey FOREIGN KEY (used_by_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: psychologist_profiles psychologist_profiles_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_profiles
    ADD CONSTRAINT psychologist_profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: psychologist_profiles psychologist_profiles_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_profiles
    ADD CONSTRAINT psychologist_profiles_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: psychologist_profiles psychologist_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.psychologist_profiles
    ADD CONSTRAINT psychologist_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: questions questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(test_id) ON DELETE CASCADE;


--
-- Name: support_request_confirmations support_request_confirmations_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations
    ADD CONSTRAINT support_request_confirmations_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.user_notifications(notification_id) ON DELETE SET NULL;


--
-- Name: support_request_confirmations support_request_confirmations_psychologist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations
    ADD CONSTRAINT support_request_confirmations_psychologist_id_fkey FOREIGN KEY (psychologist_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: support_request_confirmations support_request_confirmations_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_confirmations
    ADD CONSTRAINT support_request_confirmations_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.support_requests(request_id) ON DELETE CASCADE;


--
-- Name: support_request_notes support_request_notes_psychologist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_notes
    ADD CONSTRAINT support_request_notes_psychologist_id_fkey FOREIGN KEY (psychologist_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: support_request_notes support_request_notes_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_request_notes
    ADD CONSTRAINT support_request_notes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.support_requests(request_id) ON DELETE CASCADE;


--
-- Name: support_requests support_requests_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: support_requests support_requests_assigned_psychologist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_assigned_psychologist_id_fkey FOREIGN KEY (assigned_psychologist_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: support_requests support_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: test_results test_results_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(test_id) ON DELETE CASCADE;


--
-- Name: test_results test_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: tests tests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict B3x3uMAxfz53AjQGchuLRCZK9D2m5dqhZHyvy6jMU3kwOQdVUzaMbdQhDkapGrJ

