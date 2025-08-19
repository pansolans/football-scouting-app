-- =====================================================
-- SUPABASE SCHEMA COMPLETO - FOOTBALL SCOUTING APP
-- =====================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =====================================================
-- CORE TABLES (Synced from Wyscout)
-- =====================================================

-- Areas/Countries table
create table areas (
    id uuid default uuid_generate_v4() primary key,
    wyscout_id integer unique not null,
    name varchar(255) not null,
    alpha2_code varchar(2),
    alpha3_code varchar(3),
    last_sync timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Competitions table
create table competitions (
    id uuid default uuid_generate_v4() primary key,
    wyscout_id integer unique not null,
    name varchar(255) not null,
    area_id uuid references areas(id),
    category varchar(50) default 'default',
    division_level integer default 0,
    format varchar(100),
    gender varchar(10) default 'male',
    type varchar(50),
    gsm_id integer,
    last_sync timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Teams table
create table teams (
    id uuid default uuid_generate_v4() primary key,
    wyscout_id integer unique not null,
    name varchar(255) not null,
    official_name varchar(255),
    area_id uuid references areas(id),
    city varchar(255),
    category varchar(50) default 'default',
    gender varchar(10) default 'male',
    type varchar(50),
    gsm_id integer,
    last_sync timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Players table
create table players (
    id uuid default uuid_generate_v4() primary key,
    wyscout_id integer unique not null,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    short_name varchar(255),
    birth_date date,
    birth_area_id uuid references areas(id),
    nationality varchar(100),
    gender varchar(10) default 'male',
    foot varchar(10),
    height integer,
    weight integer,
    status varchar(50) default 'active',
    current_team_id uuid references teams(id),
    position_code2 varchar(2),
    position_name varchar(50),
    photo_url text,
    gsm_id integer,
    wyscout_data jsonb,
    last_sync timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Matches table
create table matches (
    id uuid default uuid_generate_v4() primary key,
    wyscout_id integer unique not null,
    competition_id uuid references competitions(id),
    home_team_id uuid references teams(id),
    away_team_id uuid references teams(id),
    match_date timestamp with time zone,
    gameweek integer,
    status varchar(50),
    home_score integer default 0,
    away_score integer default 0,
    label varchar(500),
    has_data_available boolean default false,
    gsm_id integer,
    wyscout_data jsonb,
    last_sync timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- =====================================================
-- SCOUTING TABLES (Our custom data)
-- =====================================================

-- Scout users
create table scouts (
    id uuid default uuid_generate_v4() primary key,
    email varchar(255) unique not null,
    name varchar(255) not null,
    role varchar(50) default 'scout',
    organization varchar(255),
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Scout reports
create table scout_reports (
    id uuid default uuid_generate_v4() primary key,
    scout_id uuid references scouts(id),
    player_id uuid references players(id),
    match_id uuid references matches(id),
    overall_rating integer check (overall_rating >= 1 and overall_rating <= 10),
    technical_rating integer check (technical_rating >= 1 and technical_rating <= 10),
    physical_rating integer check (physical_rating >= 1 and physical_rating <= 10),
    mental_rating integer check (mental_rating >= 1 and mental_rating <= 10),
    tactical_rating integer check (tactical_rating >= 1 and tactical_rating <= 10),
    performance_summary text,
    strengths text[],
    weaknesses text[],
    recommendations text,
    scout_confidence integer check (scout_confidence >= 1 and scout_confidence <= 5),
    follow_up_required boolean default false,
    tags varchar(100)[],
    priority_level integer default 3 check (priority_level >= 1 and priority_level <= 5),
    match_watched_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(scout_id, player_id, match_id)
);

-- Player watchlist
create table player_watchlist (
    id uuid default uuid_generate_v4() primary key,
    scout_id uuid references scouts(id),
    player_id uuid references players(id),
    priority integer default 3 check (priority >= 1 and priority <= 5),
    status varchar(50) default 'watching',
    category varchar(50),
    notes text,
    times_scouted integer default 0,
    last_scouted_date date,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(scout_id, player_id)
);

-- Sync logs
create table sync_logs (
    id uuid default uuid_generate_v4() primary key,
    entity_type varchar(50) not null,
    entity_id varchar(100),
    sync_type varchar(50) not null,
    status varchar(50) not null,
    error_message text,
    api_calls_made integer default 1,
    sync_duration_ms integer,
    records_processed integer default 0,
    records_created integer default 0,
    records_updated integer default 0,
    created_at timestamp with time zone default now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

create index idx_players_wyscout_id on players(wyscout_id);
create index idx_players_name on players using gin(short_name gin_trgm_ops);
create index idx_players_team on players(current_team_id);
create index idx_matches_wyscout_id on matches(wyscout_id);
create index idx_matches_date on matches(match_date);
create index idx_scout_reports_player on scout_reports(player_id);
create index idx_scout_reports_scout on scout_reports(scout_id);
create index idx_watchlist_scout on player_watchlist(scout_id);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample scout
insert into scouts (email, name, organization) values 
('scout@example.com', 'Test Scout', 'Demo Club');

-- =====================================================
-- VIEWS
-- =====================================================

create view vw_players_summary as
select 
    p.id,
    p.wyscout_id,
    p.first_name,
    p.last_name,
    p.short_name,
    p.birth_date,
    extract(year from age(p.birth_date)) as age,
    p.nationality,
    p.position_name,
    p.photo_url,
    t.name as current_team,
    coalesce(sr.report_count, 0) as total_reports,
    coalesce(sr.avg_rating, 0) as average_rating,
    coalesce(wl.watchlist_count, 0) as times_watchlisted,
    p.last_sync,
    p.updated_at
from players p
left join teams t on t.id = p.current_team_id
left join (
    select 
        player_id,
        count(*) as report_count,
        avg(overall_rating) as avg_rating
    from scout_reports 
    group by player_id
) sr on sr.player_id = p.id
left join (
    select 
        player_id,
        count(*) as watchlist_count
    from player_watchlist 
    where status = 'watching'
    group by player_id
) wl on wl.player_id = p.id;