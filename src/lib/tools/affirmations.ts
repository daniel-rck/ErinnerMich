export interface Affirmation {
  id: string
  text: string
}

export const AFFIRMATIONS: Affirmation[] = [
  { id: 'a01', text: 'Ich darf langsam machen.' },
  { id: 'a02', text: 'Heute reicht mein Bestes.' },
  { id: 'a03', text: 'Ich bin genug, so wie ich bin.' },
  { id: 'a04', text: 'Atme ein, atme aus — hier bin ich sicher.' },
  { id: 'a05', text: 'Ich darf um Hilfe bitten.' },
  { id: 'a06', text: 'Kleine Schritte sind auch Schritte.' },
  { id: 'a07', text: 'Mein Wert hängt nicht von meiner Leistung ab.' },
  { id: 'a08', text: 'Ich darf Gefühle haben, ohne sie zu erklären.' },
  { id: 'a09', text: 'Pausen sind produktiv.' },
  { id: 'a10', text: 'Ich vertraue meinem eigenen Tempo.' },
  { id: 'a11', text: 'Ich bin nicht meine Gedanken.' },
  { id: 'a12', text: 'Heute kümmere ich mich gut um mich.' },
  { id: 'a13', text: 'Ich darf Nein sagen.' },
  { id: 'a14', text: 'Was war, war. Was ist, ist genug.' },
  { id: 'a15', text: 'Ich muss nicht alles auf einmal lösen.' },
  { id: 'a16', text: 'Mein Körper trägt mich — danke dafür.' },
  { id: 'a17', text: 'Ich bin offen für Leichtigkeit.' },
  { id: 'a18', text: 'Auch unangenehme Gefühle gehen wieder.' },
  { id: 'a19', text: 'Ich bin in diesem Moment sicher.' },
  { id: 'a20', text: 'Ich darf mir Zeit lassen.' },
  { id: 'a21', text: 'Mein Wert ist nicht verhandelbar.' },
  { id: 'a22', text: 'Ich bin der Mensch, der mir am wichtigsten ist.' },
  { id: 'a23', text: 'Heute begegne ich mir freundlich.' },
  { id: 'a24', text: 'Ich darf glücklich sein, ohne es zu verdienen.' },
  { id: 'a25', text: 'Ich bin mehr als ein produktiver Tag.' },
  { id: 'a26', text: 'Ich darf Grenzen setzen — auch bei lieben Menschen.' },
  { id: 'a27', text: 'Ein Schritt nach dem anderen reicht.' },
  { id: 'a28', text: 'Ich höre auf das, was mein Körper braucht.' },
  { id: 'a29', text: 'Ich darf Fehler machen und trotzdem gut sein.' },
  { id: 'a30', text: 'Sorgen dürfen kommen — und auch wieder gehen.' },
  { id: 'a31', text: 'Ich bin nicht allein, auch wenn es sich so anfühlt.' },
  { id: 'a32', text: 'Heute bin ich auf meiner Seite.' },
  { id: 'a33', text: 'Ich entscheide, was ich heute trage.' },
  { id: 'a34', text: 'Ruhe ist erlaubt.' },
  { id: 'a35', text: 'Ich verdiene Geduld — auch von mir selbst.' },
  { id: 'a36', text: 'Mein Tempo ist mein Tempo.' },
  { id: 'a37', text: 'Ich darf neu anfangen, wann immer ich will.' },
  { id: 'a38', text: 'Ich bin gut, auch wenn ich heute wenig schaffe.' },
  { id: 'a39', text: 'Ich atme — und das genügt erstmal.' },
  { id: 'a40', text: 'Was ich fühle, ist gültig.' },
  { id: 'a41', text: 'Ich höre auf, mich mit anderen zu vergleichen.' },
  { id: 'a42', text: 'Heute bin ich freundlich zu mir.' },
  { id: 'a43', text: 'Ich verdiene Pausen, ohne sie zu rechtfertigen.' },
  { id: 'a44', text: 'Ich darf um Unterstützung bitten.' },
  { id: 'a45', text: 'Ich bin sicher, hier und jetzt.' },
  { id: 'a46', text: 'Stille ist auch eine Antwort.' },
  { id: 'a47', text: 'Ich darf wachsen, ohne perfekt zu sein.' },
  { id: 'a48', text: 'Mein Bauchgefühl darf gehört werden.' },
  { id: 'a49', text: 'Ich bin nicht verantwortlich für die Stimmung anderer.' },
  { id: 'a50', text: 'Heute lasse ich los, was nicht meins ist.' },
  { id: 'a51', text: 'Ich darf weich sein.' },
  { id: 'a52', text: 'Ich bin mein eigener sicherer Ort.' },
  { id: 'a53', text: 'Es ist okay, nicht okay zu sein.' },
  { id: 'a54', text: 'Ich darf mich um meine Bedürfnisse kümmern.' },
  { id: 'a55', text: 'Heute mache ich nur das Nötigste — und das ist genug.' },
  { id: 'a56', text: 'Ich bin im Werden.' },
  { id: 'a57', text: 'Ich muss nicht für alle alles sein.' },
  { id: 'a58', text: 'Ich vertraue dem nächsten Schritt.' },
  { id: 'a59', text: 'Mein Frieden ist mir wichtig.' },
  { id: 'a60', text: 'Ich bin willkommen — auch bei mir selbst.' },
  { id: 'a61', text: 'Ich darf staunen.' },
  { id: 'a62', text: 'Ich darf alles fühlen, ohne mich zu bewerten.' },
  { id: 'a63', text: 'Heute übe ich Dankbarkeit für Kleines.' },
  { id: 'a64', text: 'Ich erlaube mir Freude.' },
  { id: 'a65', text: 'Ich bin im Frieden mit dem, was ich nicht ändern kann.' },
]

function hashDay(day: string): number {
  let h = 0
  for (let i = 0; i < day.length; i++) {
    h = (h * 31 + day.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function affirmationForDay(day: string): Affirmation {
  const idx = hashDay(day) % AFFIRMATIONS.length
  return AFFIRMATIONS[idx]
}

export function getAffirmationById(id: string): Affirmation | undefined {
  return AFFIRMATIONS.find((a) => a.id === id)
}
