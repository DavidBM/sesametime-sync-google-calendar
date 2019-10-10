type GetUsersResponse = {
	data: Array<{User: SesameUser}>,
};

export type SesameUser = {
	id: string,
	name: string,
	surname: string,
	email: string,
	active: string,
};

type GetUserVacationResponse = {
	data: Array<{Vacation: SesameUserVacation}>,
};

type SesameUserVacation = {
	data: Array<string> | null,
	year: string,
};

export type SesameUserWithVacations = {
	user: SesameUser,
	vacation: string[][],
};

export class SesametimeService {
	constructor(
		private httpService: HttpService,
		private token: string,
	) { }

	async getAllUsersVacations(): Promise<SesameUserWithVacations[]> {
		const users = await this.getUsers();

		return await Promise.all(users.map(user => {
			return this.getUserVacations(user.id)
			.then(vacation => ({ user, vacation }));
		}));
	}

	async getUsers() {
		const response = await this.httpService.get('https://api.sesametime.com/v2/company/getEmployers', {
			headers: {Authorization: this.token},
		});

		const parsedResponse = JSON.parse(response);

		if (!isGetUsersResponse(parsedResponse)) {
			throw new Error('Unable to get Sesametime users. Response: ' +  response);
		}

		return parsedResponse.data.map(d => d.User);
	}

	async getUserVacations(userId: string) {
		const response = await this.httpService.post('https://api.sesametime.com/v2/vacation/getVacations', {
			headers: {Authorization: this.token},
			json: { userId },
		});

		if (!isGetUserVacationResponse(response)) {
			throw new Error('Unable to get Sesametime user vacations. Response: ' +  JSON.stringify(response));
		}

		const accumulator: Array<string> = [];

		response.data
		.filter(current => Array.isArray(current.Vacation.data))
		.forEach(current => accumulator.push(...(current.Vacation.data as Array<string>)));

		const vacations = autoattachHolidays(accumulator);

		return vacations;
	}
}

function autoattachHolidays(dates: Array<string>) {
	const groups = [];
	let attached: string[] = [];

	for (const date of dates) {
		if (attached.length === 0) {
			attached.push(date);
			continue;
		}

		const lastDate = attached[attached.length - 1];

		if (areConsecutiveDays(lastDate, date)) {
			attached.push(date);
		} else {
			groups.push(attached);
			attached = [date];
		}
	}

	return groups;
}

function areConsecutiveDays(a: string, b: string) {
	const dateA = new Date(a);
	const dateB = new Date(b);

	const milisecondInAHour = 36e5;

	const hours = Math.abs(dateA.getTime() - dateB.getTime()) / milisecondInAHour;

	if (hours <= 24) return true;
	return false;
}

function isGetUserVacationResponse(response: unknown): response is GetUserVacationResponse {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (!Array.isArray(object.data)) return false;

	if (!object.data.every((d: any) => d.Vacation)) {
		return false;
	}

	if (!object.data.every((d: any) => isSesameUserVacation(d.Vacation))) {
		return false;
	}

	return true;
}

function isSesameUserVacation(response: unknown): response is SesameUserVacation {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (typeof object.year !== 'string') return false;
	if (!Array.isArray(object.data) && object.data !== null) return false;
	if (object.data !== null && !object.data.every((d: any) => typeof d === 'string')) return false;

	return true;
}

function isGetUsersResponse(response: unknown): response is GetUsersResponse {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (!Array.isArray(object.data)) return false;

	if (!object.data.every((d: any) => d.User)) {
		return false;
	}

	if (!object.data.every((d: any) => isSesameUser(d.User))) {
		return false;
	}

	return true;
}

function isSesameUser(response: unknown): response is SesameUser {
	if (typeof response !== 'object' || response === null ) {
		return false;
	}

	const object = response as any;

	if (typeof object.id !== 'string') return false;
	if (typeof object.name !== 'string') return false;
	if (typeof object.surname !== 'string') return false;
	if (typeof object.email !== 'string') return false;
	if (typeof object.active !== 'string') return false;

	return true;
}
