"use client";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
};

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value: Date | null) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return <div className="date-range-picker">
    <DatePicker
      selected={start}
      onChange={(dates: [Date | null, Date | null]) => onChange(formatDate(dates[0]), formatDate(dates[1]))}
      startDate={start}
      endDate={end}
      selectsRange
      isClearable
      dateFormat="dd/MM/yyyy"
      rangeSeparator=" – "
      placeholderText="dd/mm/yyyy – dd/mm/yyyy"
      calendarStartDay={1}
      showMonthDropdown
      showYearDropdown
      yearDropdownItemNumber={6}
      dropdownMode="select"
      shouldCloseOnSelect={false}
      showPopperArrow={false}
      popperClassName="date-picker__popper"
      calendarClassName="date-picker__calendar"
      wrapperClassName="date-picker__wrapper"
      className="control date-picker__input"
      aria-label="Filter incidents by date range"
    />
    <CalendarDaysIcon className="date-picker__icon" aria-hidden="true" />
  </div>;
}
