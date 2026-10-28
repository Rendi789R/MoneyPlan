WITH ranked AS (
  SELECT
    id,
    user_id,
    lower(trim(name)) AS normalized_name,
    type,
    first_value(id) OVER (
      PARTITION BY user_id, lower(trim(name)), type
      ORDER BY is_archived ASC, id ASC
    ) AS keeper_id,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name)), type
      ORDER BY is_archived ASC, id ASC
    ) AS row_number
  FROM categories
), duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id, user_id, normalized_name, type
  FROM ranked
  WHERE row_number > 1
), merged_budgets AS (
  SELECT
    duplicate_map.user_id,
    duplicate_map.keeper_id AS category_id,
    budgets.month,
    max(budgets.amount) AS amount
  FROM budgets
  JOIN duplicate_map ON budgets.category_id = duplicate_map.duplicate_id
  GROUP BY duplicate_map.user_id, duplicate_map.keeper_id, budgets.month
)
INSERT INTO budgets (user_id, category_id, month, amount)
SELECT user_id, category_id, month, amount
FROM merged_budgets
ON CONFLICT (user_id, category_id, month)
DO UPDATE SET amount = greatest(budgets.amount, EXCLUDED.amount);
--> statement-breakpoint

WITH ranked AS (
  SELECT
    id,
    user_id,
    lower(trim(name)) AS normalized_name,
    type,
    first_value(id) OVER (
      PARTITION BY user_id, lower(trim(name)), type
      ORDER BY is_archived ASC, id ASC
    ) AS keeper_id,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name)), type
      ORDER BY is_archived ASC, id ASC
    ) AS row_number
  FROM categories
), duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked
  WHERE row_number > 1
)
UPDATE transactions
SET category_id = duplicate_map.keeper_id
FROM duplicate_map
WHERE transactions.category_id = duplicate_map.duplicate_id;
--> statement-breakpoint

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name)), type
      ORDER BY is_archived ASC, id ASC
    ) AS row_number
  FROM categories
)
DELETE FROM categories
USING ranked
WHERE categories.id = ranked.id
  AND ranked.row_number > 1;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "category_user_name_type_unique"
ON "categories" ("user_id", "name", "type");
