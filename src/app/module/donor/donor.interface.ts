export interface IRegisterDonor {
	weight?: string;
	healthNote?: string;
	lastDonationDate?: Date;
}

export interface IUpdateDonor {
	weight?: string;
	healthNote?: string;
	lastDonationDate?: Date;
}

export interface IDonorAvailability {
	isAvailable: boolean;
}

export interface IDonorQuery {
	searchTerm?: string;
	page?: string;
	limit?: string;
	sortOrder?: string;
	sortBy?: string;

	[key: string]: any;
}
