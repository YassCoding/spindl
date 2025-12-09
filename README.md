# spindl
Spindl: Build careers together

## Getting Started

### 1. Prerequisites

- Node.js
- A [Supabase](https://supabase.com/) account
- A [Google AI Studio](https://aistudio.google.com/) API Key

### 2. Installation

Clone repository and install dependencies:

```bash
git clone [https://github.com/YassCoding/spindl.git](https://github.com/YassCoding/spindl.git)
cd spindl
npm install
```

### 3. Supabase Setup

Enable Supabase Auth and configure GitHub authroization.

Run the following in your Supabase SQL Editor:

```sql
CREATE TABLE public.history (
  code text NOT NULL,
  participants jsonb,
  played_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  final_game_data jsonb NOT NULL,
  CONSTRAINT history_pkey PRIMARY KEY (code)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  avatar_url text,
  skills jsonb DEFAULT '[]'::jsonb,
  hobbies jsonb DEFAULT '[]'::jsonb,
  role_interest jsonb DEFAULT '[]'::jsonb,
  hours_per_week integer CHECK (hours_per_week > 0 AND hours_per_week <= 112),
  current_room_code text,
  past_games jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  onboarding_stage smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.rooms (
  code text NOT NULL,
  game_state jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  players jsonb NOT NULL,
  game_data jsonb NOT NULL,
  host_id uuid NOT NULL,
  CONSTRAINT rooms_pkey PRIMARY KEY (code),
  CONSTRAINT rooms_host_id_fkey FOREIGN KEY (host_id) REFERENCES auth.users(id)
);
```

```sql
create or replace function cast_vote(
  room_code text,
  card_id text,
  user_id text,
  vote_weight int
)
returns void
language plpgsql
as $$
declare
  current_state jsonb;
  r1_votes jsonb;
  votes_map jsonb;
  card_votes jsonb;
  
  card_key text;
  inner_votes jsonb;
begin
  select game_state into current_state
  from rooms
  where code = room_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  r1_votes := coalesce(current_state -> 'r1_votes', '{"total_swipes": 0, "map": {}}'::jsonb);
  
  votes_map := coalesce(r1_votes -> 'map', '{}'::jsonb);

  if vote_weight = 2 then
    for card_key, inner_votes in select * from jsonb_each(votes_map)
    loop
      if (inner_votes ->> user_id)::int = 2 then
         raise exception 'SUPER_LIKE_USED';
      end if;
    end loop;
  end if;

  card_votes := coalesce(votes_map -> card_id, '{}'::jsonb);
  
  card_votes := jsonb_set(card_votes, array[user_id], to_jsonb(vote_weight), true);
  
  votes_map := jsonb_set(votes_map, array[card_id], card_votes, true);
  
  r1_votes := jsonb_set(r1_votes, '{map}', votes_map, true);
  
  r1_votes := jsonb_set(
    r1_votes, 
    '{total_swipes}', 
    to_jsonb(coalesce((r1_votes ->> 'total_swipes')::int, 0) + 1), 
    true
  );

  current_state := jsonb_set(current_state, '{r1_votes}', r1_votes, true);

  update rooms 
  set game_state = current_state 
  where code = room_code;
end;
$$;
```

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, avatar_url, username)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'avatar_url', 
    new.raw_user_meta_data ->> 'user_name' 
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

```sql 
create or replace function place_token(
  p_room_code text,
  p_user_id uuid,
  p_card_id text,
  p_action text  
)
returns void
language plpgsql
as $$
declare
  v_game_state jsonb;
  v_allocations jsonb;
  v_current_tokens text[];
  v_user_total int;
begin
  select game_state into v_game_state
  from rooms
  where code = p_room_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  v_allocations := coalesce(v_game_state->'r2_allocations', '{}'::jsonb);

  select count(*)
  into v_user_total
  from (
    select jsonb_array_elements_text(value) as uid
    from jsonb_each(v_allocations)
  ) all_votes
  where uid = p_user_id::text;

  if p_action = 'ADD' then
    if v_user_total >= 2 then
      raise exception 'No tokens left';
    end if;

    v_current_tokens := array(select jsonb_array_elements_text(coalesce(v_allocations->p_card_id, '[]'::jsonb)));
    v_current_tokens := array_append(v_current_tokens, p_user_id::text);
    v_allocations := jsonb_set(v_allocations, array[p_card_id], to_jsonb(v_current_tokens));

  elsif p_action = 'REMOVE' then
    v_current_tokens := array(select jsonb_array_elements_text(coalesce(v_allocations->p_card_id, '[]'::jsonb)));
    
    DECLARE
      idx int;
    BEGIN
      idx := array_position(v_current_tokens, p_user_id::text);
      if idx is not null then
        v_current_tokens := v_current_tokens[1:idx-1] || v_current_tokens[idx+1:array_length(v_current_tokens, 1)];
      end if;
    END;

    v_allocations := jsonb_set(v_allocations, array[p_card_id], to_jsonb(v_current_tokens));
  end if;

  update rooms
  set game_state = jsonb_set(v_game_state, '{r2_allocations}', v_allocations)
  where code = p_room_code;
end;
$$;
```

Now rename .env.example to .env.local and add the required keys from your supabase and google AI studio. 

Finally, run

```bash
npm run dev
```

in the spndl folder.
