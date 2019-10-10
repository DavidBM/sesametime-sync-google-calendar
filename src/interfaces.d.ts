interface Credentials {
	getGoogleToken(): Promise<string>;
}

interface HttpService {
	post(url: string, options: {}): Promise<string>;
	get(url: string, options: {}): Promise<string>;
	delete(url: string, options: {}): Promise<string>;
	put(url: string, options: {}): Promise<string>;
}
