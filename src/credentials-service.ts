import {promises as fs} from 'fs';

type credentialsFile = {
	google_calendar_refresh_token: string,
	google_calendar_app_id: string,
	google_calendar_client_secret: string,
};

export class CredentialsService implements Credentials{

	private loadingFilePromise: Promise<credentialsFile>;

	constructor(
		private filePath: string,
		private httpService: {post: (url: string, body: {}) => Promise<string>},
	) {
		this.loadingFilePromise = this.loadFile();
	}

	private async loadFile() {
		const file = await fs.readFile('credentials.json');
		return JSON.parse(file.toString()) as credentialsFile;
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

		console.log(response);

		return 'hola';
	}
}
