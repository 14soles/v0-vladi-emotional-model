-- Function to update tool item stats
CREATE OR REPLACE FUNCTION update_tool_item_stats(
  p_item_id UUID,
  p_user_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tool_item_stats (item_id, user_id, times_shown, times_correct, last_shown_at)
  VALUES (p_item_id, p_user_id, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END, NOW())
  ON CONFLICT (item_id, user_id)
  DO UPDATE SET
    times_shown = tool_item_stats.times_shown + 1,
    times_correct = tool_item_stats.times_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_shown_at = NOW();
END;
$$ LANGUAGE plpgsql;
