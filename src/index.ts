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
import {SesametimeService} from './sesametime_service';
import {matchEventHolidays, SignedHoliday} from './event_holiday_matcher';

type VacationAndEvent = {holiday: SignedHoliday, event: GoogleCalendarEvent};

async function execute() {

	const credentialsService = new CredentialsService('./credentials.json', request);

	const googleCredentials = await credentialsService.getGoogleToken();
	const googleCalendarService = new GoogleCalendarService(request, googleCredentials);

	const calendarsToSync = await credentialsService.getCalendarToSync();

	const events = await googleCalendarService.getAllEvents(calendarsToSync[0]);

	const holidays = await getSesametimeHolidays(credentialsService);

	const {toUpdate, toCreate, toDelete} = matchEventHolidays(events, holidays);

	const updateCallbacks = toUpdate
	.map(event => () => updateGoogleEvent(googleCalendarService, calendarsToSync[0], event));

	const createCallbacks = toCreate
	.map(event => () => createGoogleEvent(googleCalendarService, calendarsToSync[0], event));

	const deleteCallbacks = toDelete
	.map(event => () => deleteGoogleEvent(googleCalendarService, calendarsToSync[0], event));

	const callbacks = updateCallbacks.concat(createCallbacks, deleteCallbacks);

	console.log('Update: ' , toUpdate.length, '\n\nCreate: ', toCreate.length, '\n\nDelete: ', toDelete.length);

	await iterate(callbacks)
	.parallel(5, (item: any) => item());
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
