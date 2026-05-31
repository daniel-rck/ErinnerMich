import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AttentionStrip } from "../components/AttentionStrip";
import { HabitRail } from "../components/HabitRail";
import { useMoodLog } from "../components/MoodLog/MoodLogProvider";
import { MoodStrip } from "../components/MoodStrip";
import { TodayHero } from "../components/TodayHero";
import { TodayTimeline } from "../components/TodayTimeline";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { useToast } from "../components/ui/Toast";
import { WellnessRibbon } from "../components/WellnessRibbon";
import { archiveReminder, deleteReminder, restoreReminder } from "../lib/db/reminders";
import { FADE_UP, STAGGER_CONTAINER } from "../lib/design/motion";
import { useReminders } from "../lib/hooks/useReminders";
import { useSettings } from "../lib/hooks/useSettings";
import type { Reminder } from "../lib/types";

const DELETE_GRACE_MS = 5500;

export function TodayPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const moodLog = useMoodLog();
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const { reminders, loading } = useReminders({
    kind: "reminder",
    activeOnly: true,
  });

  useEffect(() => {
    if (params.get("mood") === "open") {
      moodLog.open();
      const np = new URLSearchParams(params);
      np.delete("mood");
      setParams(np, { replace: true });
    }
  }, [params, setParams, moodLog]);

  async function handleDelete(reminder: Reminder) {
    await archiveReminder(reminder.id);
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      void deleteReminder(reminder.id);
    }, DELETE_GRACE_MS);
    toast.show({
      variant: "success",
      message: `„${reminder.title}“ gelöscht`,
      durationMs: DELETE_GRACE_MS,
      action: {
        label: "Rückgängig",
        onClick: () => {
          cancelled = true;
          clearTimeout(timer);
          void restoreReminder(reminder.id);
        },
      },
    });
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className="flex flex-col gap-[var(--space-lg)]"
    >
      {settings.wellnessToolsEnabled && (
        <motion.section variants={FADE_UP}>
          <MoodStrip />
        </motion.section>
      )}

      <motion.section variants={FADE_UP}>
        <TodayHero />
      </motion.section>

      {settings.wellnessToolsEnabled && (
        <motion.section variants={FADE_UP}>
          <WellnessRibbon />
        </motion.section>
      )}

      <motion.section variants={FADE_UP}>
        <AttentionStrip />
      </motion.section>

      <motion.section variants={FADE_UP}>
        {loading ? (
          <CardSkeleton count={2} />
        ) : (
          <TodayTimeline
            reminders={reminders}
            onEdit={(r) => navigate(`/edit/${r.id}`)}
            onDelete={handleDelete}
          />
        )}
      </motion.section>

      <motion.section variants={FADE_UP}>
        <HabitRail />
      </motion.section>
    </motion.div>
  );
}
