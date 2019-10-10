import {promises as fs} from 'fs';

type credentialsFile = {
	google_calendar_refresh_token: string,
	google_calendar_app_id: string,
	google_calendar_client_secret: string,
	sesame_token: string,
	calendars_to_sync: Array<string>,
};

type refresingTokenResponse = {
	access_token: string,
	expires_in: number,
	scope: string,
	token_type: string,
};

export class CredentialsService implements Credentials{

	private loadingFilePromise: Promise<credentialsFile>;

	constructor(
		private filePath: string,
		private httpService: HttpService,
	) {
		this.loadingFilePromise = this.loadFile();
	}

	private async loadFile() {
		const file = await fs.readFile(this.filePath);
		return JSON.parse(file.toString()) as credentialsFile;
	}

	async getCalendarToSync() {
		const content = await this.loadingFilePromise;
		return content.calendars_to_sync;
	}

	async getGoogleToken() {
		const content = await this.loadingFilePromise;

		const accessKey = content.google_calendar_refresh_token;
		const appId = content.google_calendar_app_id;
		const clientSecret = content.google_calendar_client_secret;

		const response = await this.httpService.post('https://oauth2.googleapis.com/token', {
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			form: {
				refresh_token: accessKey,
				client_id: appId,
				client_secret: clientSecret,
				redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
				grant_type: 'refresh_token',
			},
		});

		const parsedResponse = JSON.parse(response);

		if (!isRefresedTokenResponse(parsedResponse))
			throw new Error('Unable to refresh the token. Response: ' + JSON.stringify(parsedResponse));

		return 'Bearer ' + parsedResponse.access_token;
	}

	async getSesametimeToken() {
		const content = await this.loadingFilePromise;

		return 'Bearer ' + content.sesame_token;
	}
}

function isRefresedTokenResponse(response: unknown): response is refresingTokenResponse {
	if (typeof response !== 'object' || response === null) {
		return false;
	}

	const object = response as any;

	if (
		typeof object.access_token === 'string'
		&& typeof object.expires_in === 'number'
		&& typeof object.scope === 'string'
		&& typeof object.token_type === 'string'
	) {
		return true;
	}

	return false;
}
