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
import {CredentialsService} from './credentials_service';
import {GoogleCalendarService} from './google_calendar_service';
import {SesametimeService} from './sesametime_service';
import {matchEventHolidays} from './event_holiday_matcher';

async function execute() {

	const credentialsService = new CredentialsService('./credentials.json', request);

	const googleCredentials = await credentialsService.getGoogleToken();

	const googleCalendarService = new GoogleCalendarService(request, googleCredentials);

	const calendarsToSync = await credentialsService.getCalendarToSync();

	const events = await googleCalendarService.getAllEvents(calendarsToSync[0]);

	const holidays = await getSesametimeHolidays(credentialsService);

	const {toUpdate, toCreate, toDelete} = matchEventHolidays(events, holidays);

	console.log('Update: ' , toUpdate.length, '\n\nCreate: ', toCreate.length, '\n\nDelete: ', toDelete.length);

	for ( const update of toUpdate ) {
		const endDate = new Date(update.holiday.vacation[update.holiday.vacation.length - 1]);
		endDate.setDate(endDate.getDate() + 1);

		await googleCalendarService.updateEvent(
			calendarsToSync[0],
			update.event.id,
			`Holidays ${update.holiday.user.name} ${update.holiday.user.surname}`,
			generateDescription(update.holiday.signature),
			update.holiday.vacation[0],
			endDate.getFullYear()  + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate(),
		);
	}

	for ( const create of toCreate ) {
		const endDate = new Date(create.vacation[create.vacation.length - 1]);
		endDate.setDate(endDate.getDate() + 1);

		await googleCalendarService.createEvent(
			calendarsToSync[0],
			`Holidays ${create.user.name} ${create.user.surname}`,
			generateDescription(create.signature),
			create.vacation[0],
			endDate.getFullYear()  + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate(),
		);
	}

	for ( const deleteEvent of toDelete ) {
		await googleCalendarService.deleteEvent(
			calendarsToSync[0],
			deleteEvent.id,
		);
	}

	console.log('Update: ' , toUpdate, '\n\nCreate: ', toCreate, '\n\nDelete: ', toDelete);
}

execute();

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
