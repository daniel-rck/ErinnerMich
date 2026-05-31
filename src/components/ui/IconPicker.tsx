import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "./Input";
import { Sheet } from "./Sheet";

interface IconCategory {
  key: string;
  label: string;
  icons: ReadonlyArray<{ emoji: string; keywords: string }>;
}

const CATEGORIES: ReadonlyArray<IconCategory> = [
  {
    key: "time",
    label: "Zeit & Termin",
    icons: [
      { emoji: "⏰", keywords: "wecker zeit alarm" },
      { emoji: "⏱️", keywords: "stopuhr zeit timer" },
      { emoji: "📅", keywords: "kalender datum termin" },
      { emoji: "📆", keywords: "kalender datum termin" },
      { emoji: "🗓️", keywords: "kalender datum termin planer" },
      { emoji: "🔔", keywords: "glocke benachrichtigung" },
      { emoji: "🎂", keywords: "geburtstag torte feiern" },
      { emoji: "🎉", keywords: "feiern party konfetti" },
      { emoji: "🎁", keywords: "geschenk" },
      { emoji: "🏖️", keywords: "urlaub strand reise" },
      { emoji: "✈️", keywords: "flug reise urlaub" },
      { emoji: "🧾", keywords: "beleg steuer rechnung" },
    ],
  },
  {
    key: "health",
    label: "Gesundheit",
    icons: [
      { emoji: "💊", keywords: "medikament pille tablette" },
      { emoji: "💉", keywords: "spritze impfung arzt" },
      { emoji: "🩺", keywords: "arzt stethoskop vorsorge" },
      { emoji: "🦷", keywords: "zahn zahnarzt" },
      { emoji: "👁️", keywords: "auge sehtest brille" },
      { emoji: "🧠", keywords: "gehirn kopf mental" },
      { emoji: "🫀", keywords: "herz organ" },
      { emoji: "🩹", keywords: "pflaster wunde" },
      { emoji: "🧴", keywords: "creme sonnencreme" },
      { emoji: "🧘", keywords: "meditation yoga ruhe" },
      { emoji: "😴", keywords: "schlaf bett müde" },
      { emoji: "🛌", keywords: "bett schlaf" },
    ],
  },
  {
    key: "fitness",
    label: "Sport & Fitness",
    icons: [
      { emoji: "🏃", keywords: "laufen joggen running" },
      { emoji: "🚴", keywords: "fahrrad radfahren" },
      { emoji: "🏋️", keywords: "gewicht hantel kraft" },
      { emoji: "🤸", keywords: "dehnen turnen gymnastik" },
      { emoji: "🧗", keywords: "klettern" },
      { emoji: "🏊", keywords: "schwimmen" },
      { emoji: "⚽", keywords: "fußball ball" },
      { emoji: "🏀", keywords: "basketball ball" },
      { emoji: "👟", keywords: "schritte sport schuh" },
      { emoji: "💪", keywords: "muskel kraft" },
      { emoji: "🧎", keywords: "knien beten" },
      { emoji: "⛹️", keywords: "sport ball" },
    ],
  },
  {
    key: "home",
    label: "Haus & Garten",
    icons: [
      { emoji: "🏠", keywords: "haus heim" },
      { emoji: "🪴", keywords: "pflanze blume gießen topf" },
      { emoji: "🌱", keywords: "pflanze keimling" },
      { emoji: "🌸", keywords: "blume blüte" },
      { emoji: "🌿", keywords: "pflanze blatt grün" },
      { emoji: "🗑️", keywords: "müll papierkorb abfall" },
      { emoji: "🧺", keywords: "wäsche korb" },
      { emoji: "🧹", keywords: "putzen besen reinigen" },
      { emoji: "🧼", keywords: "seife waschen" },
      { emoji: "🛁", keywords: "badewanne baden" },
      { emoji: "🚿", keywords: "dusche" },
      { emoji: "🪣", keywords: "eimer reinigen" },
      { emoji: "🔥", keywords: "feuer heizung" },
      { emoji: "💡", keywords: "lampe glühbirne idee" },
      { emoji: "🪟", keywords: "fenster" },
      { emoji: "🪑", keywords: "stuhl möbel" },
    ],
  },
  {
    key: "food",
    label: "Essen & Trinken",
    icons: [
      { emoji: "💧", keywords: "wasser trinken tropfen" },
      { emoji: "🥤", keywords: "getränk trinken" },
      { emoji: "☕", keywords: "kaffee tasse" },
      { emoji: "🍵", keywords: "tee tasse" },
      { emoji: "🍎", keywords: "apfel obst gesund" },
      { emoji: "🥗", keywords: "salat gemüse gesund" },
      { emoji: "🥦", keywords: "brokkoli gemüse" },
      { emoji: "🍞", keywords: "brot" },
      { emoji: "🥛", keywords: "milch glas" },
      { emoji: "🍽️", keywords: "essen teller mahlzeit" },
      { emoji: "🍳", keywords: "kochen ei pfanne" },
      { emoji: "🚫", keywords: "verbot kein nein" },
    ],
  },
  {
    key: "social",
    label: "Sozial & Kommunikation",
    icons: [
      { emoji: "📞", keywords: "anrufen telefon" },
      { emoji: "📱", keywords: "handy phone" },
      { emoji: "💬", keywords: "nachricht chat" },
      { emoji: "✉️", keywords: "email brief nachricht" },
      { emoji: "👨‍👩‍👧", keywords: "familie" },
      { emoji: "👫", keywords: "freunde paar" },
      { emoji: "🤝", keywords: "handschlag treffen" },
      { emoji: "❤️", keywords: "herz liebe" },
      { emoji: "💌", keywords: "liebesbrief" },
      { emoji: "🎈", keywords: "ballon geburtstag" },
      { emoji: "🪪", keywords: "ausweis personalausweis" },
      { emoji: "🛂", keywords: "reisepass" },
    ],
  },
  {
    key: "work",
    label: "Arbeit & Finanzen",
    icons: [
      { emoji: "💼", keywords: "arbeit aktentasche büro" },
      { emoji: "📊", keywords: "statistik diagramm" },
      { emoji: "📈", keywords: "aufwärts wachstum" },
      { emoji: "📉", keywords: "abwärts verlust" },
      { emoji: "📝", keywords: "notiz schreiben" },
      { emoji: "📋", keywords: "klemmbrett liste" },
      { emoji: "💰", keywords: "geld sack" },
      { emoji: "💳", keywords: "kreditkarte zahlung" },
      { emoji: "🧾", keywords: "beleg rechnung steuer" },
      { emoji: "📑", keywords: "dokument versicherung" },
      { emoji: "🏦", keywords: "bank" },
      { emoji: "📺", keywords: "fernseher gez" },
    ],
  },
  {
    key: "learning",
    label: "Lernen & Hobby",
    icons: [
      { emoji: "📖", keywords: "lesen buch" },
      { emoji: "📚", keywords: "bücher lernen" },
      { emoji: "📓", keywords: "journal heft" },
      { emoji: "🗣️", keywords: "sprache sprechen" },
      { emoji: "🎨", keywords: "kunst malen" },
      { emoji: "🎵", keywords: "musik note" },
      { emoji: "🎸", keywords: "gitarre musik" },
      { emoji: "🧩", keywords: "puzzle rätsel" },
      { emoji: "🎲", keywords: "würfel spiel" },
      { emoji: "✍️", keywords: "schreiben journal" },
      { emoji: "🎯", keywords: "ziel pfeil" },
      { emoji: "🏆", keywords: "pokal erfolg" },
    ],
  },
  {
    key: "auto",
    label: "Mobilität & Saison",
    icons: [
      { emoji: "🚗", keywords: "auto fahrzeug" },
      { emoji: "🛞", keywords: "reifen rad" },
      { emoji: "⛽", keywords: "tanken benzin" },
      { emoji: "❄️", keywords: "schnee winter kälte" },
      { emoji: "☀️", keywords: "sonne sommer" },
      { emoji: "🌧️", keywords: "regen wolke" },
      { emoji: "🍂", keywords: "herbst blatt laub" },
      { emoji: "🌷", keywords: "frühling tulpe" },
      { emoji: "🏔️", keywords: "berg winter" },
      { emoji: "🚴", keywords: "fahrrad" },
    ],
  },
  {
    key: "mood",
    label: "Stimmung & Wellness",
    icons: [
      { emoji: "😄", keywords: "glücklich stimmung mood" },
      { emoji: "🙂", keywords: "okay stimmung mood" },
      { emoji: "😐", keywords: "neutral mittel stimmung" },
      { emoji: "😕", keywords: "verwirrt schlecht mood" },
      { emoji: "😞", keywords: "traurig schlecht mood" },
      { emoji: "🧠", keywords: "mental gehirn" },
      { emoji: "💜", keywords: "herz lila wellness" },
      { emoji: "✨", keywords: "glitzer affirmation" },
      { emoji: "🫁", keywords: "atmen lunge" },
      { emoji: "🌿", keywords: "natur erden" },
      { emoji: "🫙", keywords: "glas dankbarkeit" },
      { emoji: "💎", keywords: "schatz edelstein" },
      { emoji: "📦", keywords: "kiste box sorge" },
      { emoji: "🙏", keywords: "dankbarkeit beten danke" },
    ],
  },
  {
    key: "misc",
    label: "Sonstiges",
    icons: [
      { emoji: "⭐", keywords: "stern favorit" },
      { emoji: "✅", keywords: "haken erledigt ok" },
      { emoji: "⚡", keywords: "blitz energie" },
      { emoji: "🔋", keywords: "batterie energie" },
      { emoji: "🔑", keywords: "schlüssel" },
      { emoji: "🎫", keywords: "ticket eintritt" },
      { emoji: "📦", keywords: "paket garantie" },
      { emoji: "🐾", keywords: "tier haustier pfote" },
      { emoji: "🐶", keywords: "hund haustier" },
      { emoji: "🐱", keywords: "katze haustier" },
      { emoji: "🌍", keywords: "erde welt" },
      { emoji: "🎓", keywords: "abschluss mütze" },
    ],
  },
];

const ALL_ICONS = Array.from(new Set(CATEGORIES.flatMap((c) => c.icons.map((i) => i.emoji))));

interface IconPickerProps {
  /**
   * Trigger label and current value. Click opens the picker sheet.
   */
  value: string;
  onChange: (next: string) => void;
  /**
   * Optional aria-label for the trigger button. Defaults to "Symbol wählen".
   */
  ariaLabel?: string;
  /**
   * Disable the trigger button.
   */
  disabled?: boolean;
}

export function IconPicker({
  value,
  onChange,
  ariaLabel = "Symbol wählen",
  disabled = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
    setQuery("");
    setCustom("");
  }

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return CATEGORIES;
    return CATEGORIES.map((c) => ({
      ...c,
      icons: c.icons.filter((i) => i.emoji.includes(q) || i.keywords.toLowerCase().includes(q)),
    })).filter((c) => c.icons.length > 0);
  }, [query]);

  const totalMatches = useMemo(
    () => filteredCategories.reduce((acc, c) => acc + c.icons.length, 0),
    [filteredCategories],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={[
          "flex h-14 w-14 items-center justify-center",
          "rounded-[0.875rem]",
          "bg-[color:var(--color-surface)]",
          "border border-[color:var(--color-border)]",
          "text-3xl leading-none",
          "transition-[border-color,background-color] duration-[140ms]",
          "hover:border-[color:var(--color-accent-400)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <span aria-hidden>{value || "⏰"}</span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Symbol wählen">
        <div className="flex flex-col gap-[1rem] pb-[1rem]">
          <div className="relative">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)]"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={"Suchen … z.B. „wasser“, „pflanze“, „arzt“"}
              className="pl-9"
              autoFocus
            />
          </div>

          {filteredCategories.length === 0 ? (
            <p className="rounded-[0.875rem] border border-dashed border-[color:var(--color-border)] p-[1rem] text-center text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
              Keine Symbole für „{query}“
            </p>
          ) : (
            <div className="flex max-h-[min(50vh,420px)] flex-col gap-[1rem] overflow-y-auto pr-1">
              {filteredCategories.map((category) => (
                <section key={category.key} className="flex flex-col gap-[0.5rem]">
                  <h3 className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
                    {category.label}
                  </h3>
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2.75rem, 1fr))" }}
                  >
                    {category.icons.map((item) => {
                      const selected = value === item.emoji;
                      return (
                        <button
                          key={`${category.key}-${item.emoji}`}
                          type="button"
                          onClick={() => pick(item.emoji)}
                          title={item.keywords.split(" ")[0]}
                          aria-label={`Symbol ${item.emoji}`}
                          aria-pressed={selected}
                          className={[
                            "flex h-11 items-center justify-center",
                            "rounded-[0.875rem]",
                            "text-2xl leading-none",
                            "transition-[background-color,box-shadow] duration-[140ms]",
                            selected
                              ? "bg-[color:var(--color-accent-50)] ring-2 ring-[color:var(--color-accent-500)]"
                              : "hover:bg-[color:var(--color-surface-sunken)]",
                          ].join(" ")}
                        >
                          <span aria-hidden>{item.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-[0.5rem] pt-[0.75rem] border-t border-[color:var(--color-border)]">
            <label
              htmlFor="icon-picker-custom"
              className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]"
            >
              Eigenes Emoji
            </label>
            <div className="flex gap-2">
              <Input
                id="icon-picker-custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value.slice(0, 4))}
                placeholder="z.B. 🦔"
                maxLength={4}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = custom.trim();
                  if (trimmed.length > 0) pick(trimmed);
                }}
                disabled={custom.trim().length === 0}
                className={[
                  "h-11 px-4 rounded-[0.875rem]",
                  "bg-[color:var(--color-accent-600)] text-[color:white]",
                  "text-[length:0.8125rem] font-medium",
                  "hover:bg-[color:var(--color-accent-700)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                Übernehmen
              </button>
            </div>
            <p className="text-[length:0.6875rem] text-[color:var(--color-fg-subtle)]">
              {totalMatches} Symbole verfügbar
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
}

export { ALL_ICONS as ICON_PICKER_FALLBACK };
