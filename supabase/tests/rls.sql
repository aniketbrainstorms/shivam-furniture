-- Expected result when everything is correct: ERROR "ALL PASSED (rolled back on purpose)".
-- Any other message is a failure.
do $$
declare n int;
begin
  insert into categories (id, name, slug) values ('00000000-0000-0000-0000-0000000000a1', 'T', 't-cat');
  insert into products (id, name, slug, category_id, material, availability, status) values
    ('00000000-0000-0000-0000-0000000000b1', 'P1', 't-p1', '00000000-0000-0000-0000-0000000000a1', 'Sheesham', 'in_showroom', 'published');
  insert into products (id, name, slug, category_id, status) values
    ('00000000-0000-0000-0000-0000000000b2', 'P2', 't-p2', '00000000-0000-0000-0000-0000000000a1', 'draft');
  insert into product_images (product_id, path, sort_order) values
    ('00000000-0000-0000-0000-0000000000b1', 'products/b1/x', 0),
    ('00000000-0000-0000-0000-0000000000b2', 'products/b2/x', 0);

  -- 1. anon sees only published products and their images
  set local role anon;
  select count(*) into n from products where slug in ('t-p1', 't-p2');
  if n <> 1 then reset role; raise exception 'FAIL anon saw % products, expected 1', n; end if;
  select count(*) into n from product_images where path in ('products/b1/x', 'products/b2/x');
  if n <> 1 then reset role; raise exception 'FAIL anon saw % images, expected 1', n; end if;
  reset role;

  -- 2. anon cannot write
  set local role anon;
  begin
    insert into products (name, slug) values ('X', 't-x');
    reset role;
    raise exception 'FAIL anon insert succeeded';
  exception when insufficient_privilege then
    reset role;
  end;

  -- 3. publishing requires material, availability and category
  begin
    insert into products (name, slug, status) values ('Bad', 't-bad', 'published');
    raise exception 'FAIL incomplete publish allowed';
  exception when check_violation then null;
  end;

  -- 4. ready_in_days requires a day count
  begin
    insert into products (name, slug, category_id, material, availability, status)
      values ('Bad2', 't-bad2', '00000000-0000-0000-0000-0000000000a1', 'Teak', 'ready_in_days', 'published');
    raise exception 'FAIL ready_in_days without days allowed';
  exception when check_violation then null;
  end;

  -- 5. slug and category are locked once published
  begin
    update products set slug = 't-renamed' where slug = 't-p1';
    raise exception 'FAIL slug changed after publish';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into categories (id, name, slug) values ('00000000-0000-0000-0000-0000000000a2', 'T2', 't-cat2');
    update products set category_id = '00000000-0000-0000-0000-0000000000a2' where slug = 't-p1';
    raise exception 'FAIL category changed after publish';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- 6. unpublishing keeps the row and the slug
  update products set status = 'unpublished' where slug = 't-p1';
  select count(*) into n from products where slug = 't-p1' and status = 'unpublished';
  if n <> 1 then raise exception 'FAIL unpublish did not work'; end if;

  -- 7. category slug is immutable
  begin
    update categories set slug = 't-cat-new' where slug = 't-cat';
    raise exception 'FAIL category slug changed';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  raise exception 'ALL PASSED (rolled back on purpose)';
end $$;
