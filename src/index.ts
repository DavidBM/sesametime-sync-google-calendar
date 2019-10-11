/**
Steps:
	1) Get Google calendar events
	2) Match Google calendar events with sesame users.
	3) Get sesametime all users
	4) For each user, get the holiday events
	5) Delete all the matched events from google Calendar
	6) Recreate the events based in sesametime events
		- Save the user id somewhere in the event in order to make the match in the future.
**/

import * as request from 'request-promise-native';
import {iterate} from 'iterated-pipes';
import {CredentialsService} from './credentials_service';
import {GoogleCalendarService, GoogleCalendarEvent} from './google_calendar_service';
import {SesametimeService, SesameUserWithVacations} from './sesametime_service';
import {matchEventHolidays, SignedHoliday} from './event_holiday_matcher';

type VacationAndEvent = {holiday: SignedHoliday, event: GoogleCalendarEvent};

async function execute() {

	const credentialsService = new CredentialsService('./credentials.json', request);

	const vacations = await getSesametimeHolidays(credentialsService);

	const calendars = await credentialsService.getCalendarToSync();

	const callbacks = [];

	for (const calendar of calendars) {
		const changes = await getChangesFromCalendar(credentialsService, vacations, calendar);
		callbacks.push(...changes);
	}

	await iterate(callbacks)
	.parallel(5, (item: any) => item());
}

async function getChangesFromCalendar(credentials: CredentialsService, vacations: SesameUserWithVacations[], calendar: string) {
	const googleCredentials = await credentials.getGoogleToken();

	const googleCalendarService = new GoogleCalendarService(request, googleCredentials);

	const events = await googleCalendarService.getAllEvents(calendar);

	const {toUpdate, toCreate, toDelete} = matchEventHolidays(events, vacations);

	const updateCallbacks = toUpdate
	.map(event => () => updateGoogleEvent(googleCalendarService, calendar, event));

	const createCallbacks = toCreate
	.map(event => () => createGoogleEvent(googleCalendarService, calendar, event));

	const deleteCallbacks = toDelete
	.map(event => () => deleteGoogleEvent(googleCalendarService, calendar, event));

	console.log(
		'\nCalendar: ', calendar,
		'\nUpdate: ', toUpdate.length,
		'\nCreate: ', toCreate.length,
		'\nDelete: ', toDelete.length,
	);

	return updateCallbacks.concat(createCallbacks, deleteCallbacks);
}

execute();

function deleteGoogleEvent(service: GoogleCalendarService, calendar: string, event: GoogleCalendarEvent){
	return service.deleteEvent(calendar, event.id);
}

function createGoogleEvent(service: GoogleCalendarService, calendar: string, holiday: SignedHoliday){
	return service.createEvent(
		calendar,
		`Vacation ${holiday.user.name} ${holiday.user.surname}`,
		generateDescription(holiday.signature),
		holiday.vacation[0],
		getEndPeriodDate(holiday.vacation[holiday.vacation.length - 1]),
	);
}

function updateGoogleEvent(service: GoogleCalendarService, calendar: string, leave: VacationAndEvent){
	return service.updateEvent(
		calendar,
		leave.event.id,
		`Vacation ${leave.holiday.user.name} ${leave.holiday.user.surname}`,
		generateDescription(leave.holiday.signature),
		leave.holiday.vacation[0],
		getEndPeriodDate(leave.holiday.vacation[leave.holiday.vacation.length - 1]),
	);
}

function getEndPeriodDate(date: string) {
	const endDate = new Date(date);
	endDate.setDate(endDate.getDate() + 1);

	return endDate.getFullYear()  + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate();
}

async function getSesametimeHolidays(credentialsService: CredentialsService) {
	const sesametimeCredentials = await credentialsService.getSesametimeToken();

	const sesametimeService = new SesametimeService(request, sesametimeCredentials);

	return await sesametimeService.getAllUsersVacations();
}

function generateDescription(id: string) {
	return (
`%%%%%~~~~~%%%%%~~~~~%%%%%
Do not modify this text.
sesame-event-id:${id}
%%%%%~~~~~%%%%%~~~~~%%%%%`);
}
