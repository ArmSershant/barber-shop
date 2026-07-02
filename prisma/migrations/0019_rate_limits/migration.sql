-- Fixed-window rate limiting counters.

CREATE TABLE "rate_limits" (
  "key"          text NOT NULL,
  "count"        integer NOT NULL DEFAULT 0,
  "window_start" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);
