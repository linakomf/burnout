--
-- PostgreSQL database dump
--

\restrict f5t5fcpRqcQWaEWvP6wLiIsY9gCRWWEN1Ryee8lrkovozPnQ4FS95vWfruKEdn2

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
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
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
    slug character varying(64) NOT NULL,
    title character varying(120) DEFAULT ''::character varying NOT NULL,
    label_key character varying(64) DEFAULT ''::character varying NOT NULL,
    mood character varying(32) DEFAULT 'calm_down'::character varying NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    is_featured_pick boolean DEFAULT false NOT NULL,
    target_role character varying(16) DEFAULT 'all'::character varying NOT NULL,
    target_gender character varying(16) DEFAULT 'all'::character varying NOT NULL
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
2	Для студентов	Тесты на выгорание и учебную нагрузку	all	all
3	Для преподавателей	Профессиональное выгорание и нагрузка	teacher	all
\.


--
-- Data for Name: diary_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diary_entries (entry_id, user_id, mood, mood_score, note, created_at) FROM stdin;
1	2	neutral	4	привет я устала с работы	2026-04-08 17:51:44.301975
2	2	neutral	4	что еще посоветуешь мне?	2026-04-08 17:52:06.011634
3	2	neutral	4	отношения с людбми	2026-04-08 17:52:28.575728
4	2	neutral	4	сложно находить общий язык с новым коллективом	2026-04-08 17:52:52.553701
5	5	neutral	4	Привет что ты умеешь	2026-04-20 23:25:55.539917
6	5	neutral	4	Я чувствую тревогу	2026-04-20 23:26:06.93568
7	5	neutral	4	а ты не спросишь почему я чувствую тревогу?	2026-04-20 23:26:23.540282
8	5	neutral	4	я ччувствую тревогу из-за работы	2026-04-20 23:26:55.823204
10	2	neutral	4	что ты умеешь?	2026-05-06 10:17:53.930541
11	2	neutral	4	у меня проблемы с сном	2026-05-06 10:18:05.156687
12	2	neutral	4	я плохо сплю	2026-05-06 10:18:12.199971
13	2	neutral	4	😴 Мне хочется спать	2026-05-06 10:18:16.122299
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood, card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label, age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name, organizer_desc, suit_tags, important_notes, gallery_urls, created_at, updated_at, target_role, target_gender) FROM stdin;
\.


--
-- Data for Name: film_collection_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.film_collection_items (collection_id, film_id, sort_order) FROM stdin;
\.


--
-- Data for Name: film_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.film_collections (collection_id, slug, title, description, cover_url, sort_order, is_active, updated_at) FROM stdin;
\.


--
-- Data for Name: films; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.films (film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags, source, duration, year, rating, category_id, psych_tag, genres_display, embed_url, director, screenwriter, country, quote, created_at, updated_at, target_role, target_gender) FROM stdin;
\.


--
-- Data for Name: meditations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meditations (meditation_id, title, kind, topics, cover_url, description_short, duration_min, practice_focus, difficulty_level, tip_before, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, target_role, target_gender) FROM stdin;
\.


--
-- Data for Name: music_collection_tracks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_collection_tracks (collection_id, music_id, sort_order) FROM stdin;
\.


--
-- Data for Name: music_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_collections (collection_id, slug, title, label_key, mood, cover_url, sort_order, is_active, updated_at) FROM stdin;
1	mp-calm	Спокойствие	musicMoodCalm	calm_down		0	t	2026-05-28 14:07:05.954786+05
2	mp-focus	Фокус	musicMoodFocus	concentration		1	t	2026-05-28 14:07:05.957725+05
3	mp-morning	Доброе утро	musicMoodMorning	morning		2	t	2026-05-28 14:07:05.958626+05
4	mp-sleep	Сон	musicMoodSleep	rest		3	t	2026-05-28 14:07:05.959296+05
5	mp-energy	Энергия	musicMoodEnergy	motivation		4	t	2026-05-28 14:07:05.959938+05
\.


--
-- Data for Name: music_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_items (music_id, kind, title, artist, mood, genre_label, description_short, duration_min, duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, is_featured_pick, target_role, target_gender) FROM stdin;
\.


--
-- Data for Name: podcast_episodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.podcast_episodes (podcast_id, title, show_name, description_short, meta_line, topic, episode_num, duration_min, duration_display, is_featured_pick, cover_url, audio_source, audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at, tags, target_role, target_gender) FROM stdin;
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
1	2	micro_break	6	2026-04-10 20:19:10.368431
\.


--
-- Data for Name: psychologist_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_documents (document_id, user_id, file_path, original_name, created_at) FROM stdin;
1	11	/uploads/psych_doc_1780550727412_9cbc5742.pdf	ÑÐµÐ·ÑÐ¼Ðµ-Aidana.pdf	2026-06-04 10:25:27.421807
\.


--
-- Data for Name: psychologist_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_invitations (invitation_id, token, email, invite_name, work_phone, organization, specialist_level, invited_by, expires_at, used_at, used_by_user_id, created_at) FROM stdin;
1	f4a277bc90fb1a82eb034fb151e97578bddab7d4ec852389f768f214f1e2ab85	agabayeva17@gmail.com	Alexa	8777777777	ООО	Практик	1	2026-06-02 18:53:26.428	2026-05-26 18:54:33.428102	11	2026-05-26 18:53:26.42924
\.


--
-- Data for Name: psychologist_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.psychologist_profiles (user_id, account_status, organization, specialist_level, work_phone, whatsapp, education, specialization, experience_years, bio, invited_by, invitation_id, reviewed_by, reviewed_at, review_note, created_at, updated_at) FROM stdin;
11	approved	ООО	Практик	8777777777	8777777777	Бакалавриат "Нархоз"	"Психология и биология"	1	Начинающий психолог	1	1	1	2026-05-26 18:55:11.252945	\N	2026-05-26 18:54:33.428102	2026-06-04 10:25:27.420758
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, test_id, question_text, options, order_num) FROM stdin;
4	8	Вопрос 1	["да", "нет", "", "", ""]	1
5	2	Я чувствую себя эмоционально истощённым от учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
6	2	К концу учебного дня я чувствую себя опустошённым	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
7	2	Я чувствую усталость, когда думаю о необходимости идти на занятия	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
8	2	Мне стало безразлично, успею ли я сдать задание в срок	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
9	2	Я сомневаюсь в важности учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
10	2	Я эффективно решаю учебные задачи	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
11	2	Я чувствую вдохновение от учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
12	2	Мне удаётся создавать спокойную атмосферу на занятиях	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
13	2	Я чувствую стимул и заряжен после выполнения заданий	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
14	3	Мне трудно заставить себя открыть учебные материалы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
15	3	Я чувствую, что выгорел от дедлайнов и контрольных	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
16	3	После учёбы у меня не остаётся сил на отдых и общение	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
17	3	Я откладываю задания, даже когда понимаю их важность	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
18	3	Мне кажется, что я отстаю от программы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
19	3	Я раздражаюсь из-за мелочей, связанных с учёбой	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
20	3	Мне трудно концентрироваться на лекциях и текстах	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
21	3	Я чувствую вину, если отдыхаю вместо учёбы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
22	4	Я чувствую себя эмоционально опустошённым из-за работы	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
23	4	Утром мне тяжело идти на работу	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
24	4	После рабочего дня я чувствую себя «выжатым»	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
25	4	Я стал меньше сопереживать проблемам студентов/коллег	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
26	4	Мне трудно сохранять энтузиазм в профессии	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
27	4	Я эффективно решаю рабочие задачи	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
28	4	В моей работе много интересного и смысла	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
29	4	Я умею отключаться от работы вне рабочего времени	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
30	4	Я доволен тем, чего достигаю на работе	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
50	3	Мне трудно верить, что смогу стабильно тянуть учёбу до конца семестра	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
55	5	Мне кажется, что на меня свалилось слишком много задач	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
56	5	Я не успеваю восстанавливаться между рабочими или учебными днями	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
57	5	Мне трудно сказать «нет» новым обязанностям	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
58	5	Из-за нагрузки я жертвую сном	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
59	5	Я чувствую постоянное ощущение спешки	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
60	5	Мне не хватает времени на семью, друзей и хобби	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
61	5	Я раздражаюсь, когда меня отвлекают от дел	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
62	5	В конце недели я чувствую себя полностью вымотанным	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
63	5	Я чувствую, что теряю интерес к тому, что раньше мотивировало	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
64	6	За последние 2 недели как часто вас беспокоило ощущение нервозности, тревоги или напряжённости?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	1
65	6	Как часто вам было трудно остановить беспокойство или контролировать его?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	2
66	6	Как часто вы слишком сильно беспокоились о разных вещах?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	3
67	6	Как часто вам было трудно расслабиться?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	4
68	6	Как часто вы были настолько беспокойны, что трудно усидеть на месте?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	5
69	6	Как часто вы легко раздражались или злились?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	6
70	6	Как часто вам казалось, что может случиться что-то плохое?	["Ни разу", "Несколько дней", "Более половины дней", "Почти каждый день"]	7
71	7	Я чувствую усталость (физическую и эмоциональную)	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	1
72	7	Мне трудно сосредоточиться на задачах	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	2
73	7	Я испытываю тревогу или напряжение	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	3
74	7	Я откладываю дела или избегаю их	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	4
75	7	День ощущается тяжёлым или неприятным	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	5
76	7	Мне трудно расслабиться	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	6
77	7	Я раздражителен или легко выхожу из себя	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	7
78	7	Мне не хватает сил на то, что раньше давалось легче	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	8
79	7	К вечеру я чувствую опустошённость	["Никогда", "Редко", "Иногда", "Часто", "Всегда"]	9
\.


--
-- Data for Name: reading_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reading_items (reading_id, kind, title, category, cover_url, description_short, body_full, read_url, created_at, updated_at, target_role, target_gender) FROM stdin;
\.


--
-- Data for Name: support_request_confirmations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_request_confirmations (confirmation_id, request_id, milestone, psychologist_id, user_confirmed, notification_id, created_at, responded_at) FROM stdin;
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
1	2	Aidana Agabayeva	aidana@gmail.com	большая нагрузка работы и учебы	2026-05-06 10:24:58.669988	contacted	11	2026-05-26 18:56:10.353892	1	\N
\.


--
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_results (result_id, user_id, test_id, score, level, answers, created_at) FROM stdin;
1	2	8	0	Низкий	{"4": 0}	2026-04-07 10:55:21.197331
2	2	8	0	Низкий	{"4": 0}	2026-04-08 17:51:11.472435
3	2	3	21	Средний	{"14": 3, "15": 1, "16": 2, "17": 2, "18": 2, "19": 2, "20": 4, "21": 3, "50": 2}	2026-05-06 10:11:11.621237
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (test_id, title, description, category_id, created_at, scoring_type, target_role, target_gender) FROM stdin;
8	Тест на эмоциональное истощение	Lorem ipsum Lorem ipsum Lorem ipsum	1	2026-04-07 10:54:43.556345	likert_sum	all	all
2	MBI - Опросник выгорания Маслах (студенты)	Адаптированная версия для студентов: эмоциональное истощение, деперсонализация, эффективность.	2	2026-03-20 23:25:11.458556	mbi_student	all	all
3	Тест на академическую усталость	Оценка усталости от учебы и мотивации.	2	2026-03-20 23:25:11.458556	likert_sum	all	all
4	MBI - Профессиональное выгорание (преподаватели)	Классическая версия MBI для педагогов.	3	2026-03-20 23:25:11.458556	likert_sum	all	all
5	Тест на рабочую перегрузку	9 вопросов по шкале от «Никогда» до «Всегда» - ориентир, не диагноз.	1	2026-03-20 23:25:11.458556	likert_sum	all	all
6	GAD-7: скрининг тревожности	Семь вопросов за последние 2 недели. Логика GAD-7; не заменяет консультацию врача.	3	2026-04-07 10:47:32.015929	gad7	all	all
7	Ежедневный чек-ин (9 вопросов)	Те же варианты ответа, что в основном опросе - для сопоставимой динамики в аналитике.	2	2026-04-07 10:48:13.088333	daily5	all	all
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notifications (notification_id, user_id, type, title, body, payload, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, age, email, password, role, avatar, created_at, onboarding_burnout_completed, onboarding_burnout_percent, onboarding_burnout_completed_at, daily_personalization_json, gender, space_preferences, has_completed_space_onboarding, notifications_enabled, last_name) FROM stdin;
2	Aidana Agabayeva	19	aidana@gmail.com	123456	student	\N	2026-03-20 23:36:09.082436	t	37	2026-04-07 10:43:52.865767	\N	\N	\N	f	t	\N
5	Aigul	42	aigul@gmail.com	123456	teacher	\N	2026-04-15 10:32:53.471714	t	80	2026-04-15 10:34:36.562089	\N	\N	\N	f	t	\N
11	Сабина Майдарова	\N	agabayeva17@gmail.com	123456	psychologist	/uploads/psych_avatar_1780550727403_910c5d8f.png	2026-05-26 18:54:33.428102	f	\N	\N	\N	\N	\N	f	t	\N
1	admin	\N	admin@burnout.kz	admin123	admin	\N	2026-03-20 23:25:11.470602	t	\N	\N	\N	\N	\N	f	t	\N
6	Администратор	\N	admin@com	123	admin	\N	2026-04-18 23:19:14.474201	t	\N	\N	\N	\N	\N	f	t	\N
10	Мопс	21	mops@gmail.com	123456	student	/avatars/av-student-girl.png	2026-05-10 23:06:05.258542	t	83	2026-05-10 23:07:52.414413	\N	girl	\N	f	t	\N
\.


--
-- Name: admin_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_admin_id_seq', 1, false);


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 3, true);


--
-- Name: diary_entries_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diary_entries_entry_id_seq', 13, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 1, false);


--
-- Name: film_collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.film_collections_collection_id_seq', 1, false);


--
-- Name: films_film_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.films_film_id_seq', 1, false);


--
-- Name: meditations_meditation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meditations_meditation_id_seq', 1, false);


--
-- Name: music_collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_collections_collection_id_seq', 35, true);


--
-- Name: music_items_music_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_items_music_id_seq', 1, false);


--
-- Name: podcast_episodes_podcast_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.podcast_episodes_podcast_id_seq', 1, false);


--
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.practice_sessions_session_id_seq', 1, true);


--
-- Name: psychologist_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.psychologist_documents_document_id_seq', 1, true);


--
-- Name: psychologist_invitations_invitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.psychologist_invitations_invitation_id_seq', 1, true);


--
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 79, true);


--
-- Name: reading_items_reading_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reading_items_reading_id_seq', 1, false);


--
-- Name: support_request_confirmations_confirmation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_request_confirmations_confirmation_id_seq', 1, false);


--
-- Name: support_request_notes_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_request_notes_note_id_seq', 1, false);


--
-- Name: support_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_requests_request_id_seq', 1, true);


--
-- Name: test_results_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_results_result_id_seq', 3, true);


--
-- Name: tests_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tests_test_id_seq', 8, true);


--
-- Name: user_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_notifications_notification_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 11, true);


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

\unrestrict f5t5fcpRqcQWaEWvP6wLiIsY9gCRWWEN1Ryee8lrkovozPnQ4FS95vWfruKEdn2

