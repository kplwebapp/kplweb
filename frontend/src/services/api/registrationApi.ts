import { apiClient } from './client';
import type { ApiEnvelope } from './contentApi';
import type { ActivityStatus } from './activitiesApi';

export interface CricketSkills {
  batting_style: string;
  bowling_style: string;
  is_wicketkeeper: string;
  tshirt_size: string;
  trouser_size: string;
  tshirt_number: number;
}

export interface PersonalDetails {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  vibhaag: string | null;
  date_of_birth: string | null;
  mobile: string | null;
  email: string;
}

export interface TournamentRegistration {
  registration_id: number;
  status: string;
  registered_at: string;
}

export interface RegistrationForm {
  tournament: {
    event_id: number;
    title: string;
    slug: string;
    status: ActivityStatus;
    event_date: string | null;
    end_date: string | null;
    venue: string | null;
    category_name: string | null;
    image_url: string | null;
  };
  is_open: boolean;
  personal: PersonalDetails;
  skills: Partial<CricketSkills> | null;
  registration: TournamentRegistration | null;
}

export const registrationApi = {
  getForm: (slug: string) =>
    apiClient.get<ApiEnvelope<RegistrationForm>>(`/events/slug/${encodeURIComponent(slug)}/registration`),
  register: (slug: string, skills: CricketSkills) =>
    apiClient.put<ApiEnvelope<{ created: boolean; registration: TournamentRegistration; skills: CricketSkills }>>(
      `/events/slug/${encodeURIComponent(slug)}/registration`,
      skills,
    ),
};
