type GoogleListEventsResponse = {
	items: Array<GoogleCalendarEvent>;
};

export type GoogleCalendarEvent = {
	kind: string;
	id: string;
	created: string;
	updated: string;
	description: string | undefined;
};

export class GoogleCalendarService {

	constructor(
		private httpService: HttpService,
		private accessToken: string,
	) { }

	// Needs scope: https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar
	async getAllCalendars() {
		return await this.httpService.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
			headers: { Authorization: this.accessToken },
		});
	}

	// Needs scope: https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events
	async getAllEvents(calendarId: string) {
		const timeMin = new Date();

		timeMin.setMonth(timeMin.getMonth() - 12);

		const response = await this.httpService.get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
			qs: {
				timeMin: toRFC3339DateString(timeMin),
			},
			headers: { Authorization: this.accessToken },
		});

		const parsedResponse = JSON.parse(response);

		if (!isGoogleListEventsResponse(parsedResponse)) {
			throw new Error('Unable to get event list from Google Calendar. Response: ' + response);
		}

		return parsedResponse.items;
	}

	deleteEvent(calendarId: string, eventId: string) {
		return this.httpService.delete(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
			headers: { Authorization: this.accessToken },
		});
	}

	updateEvent(calendarId: string, eventId: string, summary: string, description: string, from: string, to: string) {
		return this.httpService.put(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
			json: {
				start: {date: from},
				end: {date: to},
				summary,
				description,
			},
			headers: { Authorization: this.accessToken },
		});
	}

	createEvent(calendarId: string, summary: string, description: string, from: string, to: string) {
		return this.httpService.post(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
			json: {
				start: {date: from},
				end: {date: to},
				summary,
				description,
			},
			headers: { Authorization: this.accessToken },
		});
	}
}

function toRFC3339DateString(d: Date){

	const pad = (n: number) => (n < 10) ? ('0' + n) : n;

	return d.getUTCFullYear() 	+ '-'
	+ pad(d.getUTCMonth() + 1) 	+ '-'
	+ pad(d.getUTCDate()) 		+ 'T'
	+ pad(d.getUTCHours()) 		+ ':'
	+ pad(d.getUTCMinutes()) 	+ ':'
	+ pad(d.getUTCSeconds()) 	+ 'Z';
}

function isGoogleListEventsResponse(response: unknown): response is GoogleListEventsResponse {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (!Array.isArray(object.items)) return false;

	if (!object.items.every(isGoogleCalendarEvent)) {
		return false;
	}

	return true;
}

function isGoogleCalendarEvent(response: unknown): response is GoogleCalendarEvent {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (typeof object.kind !== 'string') return false;
	if (typeof object.id !== 'string') return false;
	if (typeof object.created !== 'string') return false;
	if (typeof object.updated !== 'string') return false;
	// if (typeof object.summary !== 'string') return false;

	return true;
}
