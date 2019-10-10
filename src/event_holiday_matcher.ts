import {SesameUserWithVacations, SesameUser} from './sesametime_service';
import {GoogleCalendarEvent} from './google_calendar_service';

type UnfoldedHoliday = {user: SesameUser, vacation: string[]};
type SignedUnfoldedHoliday = {user: SesameUser, vacation: string[], signature: string};

export function matchEventHolidays(calendarEvents: GoogleCalendarEvent[], sesameHolidays: SesameUserWithVacations[]) {
	const unfoldedHolidays: Array<UnfoldedHoliday> = [];

	sesameHolidays.forEach(holiday => holiday.vacation.forEach(vacation => unfoldedHolidays.push({user: holiday.user, vacation})));

	const signedUnfoldedHolidays: SignedUnfoldedHoliday[] = unfoldedHolidays
	.map(({user, vacation}) => ({user, vacation, signature: createSignature({user, vacation})}));

	const foundResults = signedUnfoldedHolidays.map(holiday => ({
		holiday,
		event: match(calendarEvents, holiday),
	}));

	const matched = foundResults.filter(matchedHoliday => matchedHoliday.event.length > 0);
	const toCreate = foundResults.filter(matchedHoliday => matchedHoliday.event.length === 0).map(e => e.holiday);
	const toDelete = findUnmatched(calendarEvents, signedUnfoldedHolidays);

	matched.forEach(holidayEvent => {
		const [ , ...rest] = holidayEvent.event;
		toDelete.push(...rest);
	});

	const toUpdate = matched.map(({holiday, event}) => ({holiday, event: event[0]}));

	return {toUpdate, toCreate, toDelete};
}

function match(calendarEvents: GoogleCalendarEvent[], holiday: SignedUnfoldedHoliday) {
	return calendarEvents.filter(event => event.description.includes(holiday.signature));
}

function findUnmatched(calendarEvents: GoogleCalendarEvent[], holidays: SignedUnfoldedHoliday[]) {
	return calendarEvents
	.filter(event => !holidays.some(holiday => event.description.includes(holiday.signature)))
	.filter(event => {
		return event.description.includes('Do not modify this text.')
		&& event.description.includes('%%%%%~~~~~%%%%%~~~~~%%%%%')
		&& event.description.includes('sesame-event-id:');
	});
}

function createSignature(sesameHoliday: UnfoldedHoliday): string {
	const vacation = sesameHoliday.vacation;

	return Buffer
	.from(`${sesameHoliday.user.id}-${vacation[0]}-${vacation[vacation.length - 1]}`)
	.toString('base64');
}
