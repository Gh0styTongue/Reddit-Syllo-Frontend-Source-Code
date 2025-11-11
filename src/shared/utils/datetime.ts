/**
 * Format elapsed time as MM:SS
 * @param ms - The elapsed time in milliseconds
 * @returns The formatted time as a string in the format MM:SS
 */
export const formatTime = (ms: number | undefined) => {
  if (!ms) {
    return undefined;
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export function isoDateStrToFormattedDate(isoDateString: string | undefined) {
  if (!isoDateString) {
    return undefined;
  }
  const date = new Date(isoDateString);
  return getFormattedDate(date);
}

export function getFormattedDate(date: Date) {
  const year = date.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

export function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString("en-CA");
}

export function getCompactDate(date: Date) {
  const targetYear: number = date.getFullYear();
  // getMonth() is 0-indexed, so add 1 and pad with '0' if needed
  const targetMonth: string = (date.getMonth() + 1).toString().padStart(2, "0");
  const targetDay: string = date.getDate().toString().padStart(2, "0");

  // Concatenate the parts without hyphens
  return `${targetYear}${targetMonth}${targetDay}`;
}

export function getYearWeek(date: Date): string {
  // Create a new Date object to avoid modifying the original date.
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  // In the ISO 8601 system, Thursday's week number determines the week number for the entire week.
  // The following line sets the date to the Thursday of the current week.
  // We use (d.getUTCDay() || 7) to treat Sunday (which is 0) as 7.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  // Get the first day of the year to which the Thursday belongs.
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calculate the week number.
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return `${d.getUTCFullYear()}-${weekNumber}`;
}

/**
 * Parses a formatted date like "July 24th, 2025" into a day index and day label.
 * @param formattedDate - The formatted date string.
 * @returns A tuple containing the day index and day label. 0 is Monday, 6 is Sunday.
 */

export function parseFormattedDate(formattedDate: string): [number, string] {
  // Parse the formatted date string like "July 24th, 2025"
  const match = formattedDate.match(/^(\w+)\s+(\d+)(?:st|nd|rd|th)?,\s+(\d+)$/);

  if (!match) {
    throw new Error(`Invalid date format: ${formattedDate}`);
  }

  const [, monthName, dayStr, yearStr] = match;

  if (!monthName || !dayStr || !yearStr) {
    throw new Error(`Invalid date format: ${formattedDate}`);
  }

  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);

  // Convert month name to month index (0-11)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIndex = monthNames.findIndex(
    (name) => name.toLowerCase() === monthName.toLowerCase()
  );

  if (monthIndex === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }

  const date = new Date(year, monthIndex, day);

  // Prefer for weeks to start on Monday.
  // Convert to Monday=0, Sunday=6.
  const dayIndex = (date.getDay() + 6) % 7;
  const dayLabel = date.toLocaleDateString("en-US", { weekday: "long" });
  return [dayIndex, dayLabel];
}

export function getDayIndexFromIsoString(isoDateString: string): number {
  const date = new Date(isoDateString);
  return (date.getDay() + 6) % 7;
}

function getDayWithSuffix(day: number): string {
  if (day > 3 && day < 21) return day + "th";
  switch (day % 10) {
    case 1:
      return day + "st";
    case 2:
      return day + "nd";
    case 3:
      return day + "rd";
    default:
      return day + "th";
  }
}

export function isoToAmericanFormattedDate(isoDateString: string): string {
  const date = new Date(isoDateString);

  const options = {
    weekday: "long" as const,
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  };

  const weekdayAndMonthAndYear = new Intl.DateTimeFormat(
    "en-US",
    options
  ).format(date);
  const day = date.getDate();
  const dayWithSuffix = getDayWithSuffix(day);

  const formattedDate = weekdayAndMonthAndYear.replace(
    day.toString(),
    dayWithSuffix
  );

  return formattedDate;
}
