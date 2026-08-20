import axios from 'axios';
import { createClient } from '@metagptx/web-sdk';
import { getAPIBaseURL } from '@/lib/config';

export const client = createClient();

// Public data API calls using entities (create_only=false tables)
export const api = {
  // Restaurants
  async getRestaurantTripadvisorDetail(id: number) {
    try {
      const response = await axios.get(`${getAPIBaseURL()}/api/v1/entities/restaurants/${id}/tripadvisor`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Tripadvisor detail:', error);
      return { available: false };
    }
  },

  async getRestaurants(filters?: { city?: string; cuisine?: string; kids_menu?: boolean; pet_friendly?: boolean; shabbat_open?: boolean }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.city) query.city = filters.city;
      if (filters?.cuisine) query.cuisine = filters.cuisine;
      if (filters?.kids_menu !== undefined) query.kids_menu = filters.kids_menu;
      if (filters?.pet_friendly !== undefined) query.pet_friendly = filters.pet_friendly;
      if (filters?.shabbat_open !== undefined) query.shabbat_open = filters.shabbat_open;

      const response = await client.entities.restaurants.query({
        query,
        sort: '-rating',
        limit: 200,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      return [];
    }
  },

  // Accommodations
  async getAccommodations(filters?: { city?: string; type?: string; min_stars?: number }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.city) query.city = filters.city;
      if (filters?.type) query.type = filters.type;

      const response = await client.entities.accommodations.query({
        query,
        sort: '-rating',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch accommodations:', error);
      return [];
    }
  },

  // Tourist Sites
  async getTouristSites(filters?: { category?: string; city?: string; region?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.category) query.category = filters.category;
      if (filters?.city) query.city = filters.city;
      if (filters?.region) query.region = filters.region;

      const response = await client.entities.tourist_sites.query({
        query,
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch tourist sites:', error);
      return [];
    }
  },

  // Experiences
  async getExperiences(filters?: { category?: string; city?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.category) query.category = filters.category;
      if (filters?.city) query.city = filters.city;

      const response = await client.entities.experiences.query({
        query,
        sort: '-rating',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      return [];
    }
  },

  // Shopping Brands
  async getShoppingBrands(filters?: { category?: string; featured?: boolean; made_in_israel?: boolean; israeli_brand?: boolean }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.category) query.category = filters.category;
      if (filters?.featured !== undefined) query.is_featured = filters.featured;
      if (filters?.made_in_israel !== undefined) query.made_in_israel = filters.made_in_israel;
      if (filters?.israeli_brand !== undefined) query.israeli_brand = filters.israeli_brand;

      const response = await client.entities.shopping_brands.query({
        query,
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch shopping brands:', error);
      return [];
    }
  },

  // Shopping Brand by ID
  async getShoppingBrand(id: number) {
    try {
      const response = await client.entities.shopping_brands.get({
        id: String(id),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shopping brand:', error);
      return null;
    }
  },

  // Shopping Stores
  async getShoppingStores(filters?: { city?: string; brand_id?: number }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.city) query.city = filters.city;
      if (filters?.brand_id) query.brand_id = filters.brand_id;

      const response = await client.entities.shopping_stores.query({
        query,
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch shopping stores:', error);
      return [];
    }
  },

  // Shopping Store by ID
  async getShoppingStore(id: number) {
    try {
      const response = await client.entities.shopping_stores.get({
        id: String(id),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shopping store:', error);
      return null;
    }
  },

  // Shopping Offers
  async getShoppingOffers(filters?: { brand_id?: number; store_id?: number; category?: string; status?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.brand_id) query.brand_id = filters.brand_id;
      if (filters?.store_id) query.store_id = filters.store_id;
      if (filters?.category) query.category = filters.category;
      if (filters?.status) query.status = filters.status;

      const response = await client.entities.shopping_offers.query({
        query,
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch shopping offers:', error);
      return [];
    }
  },

  // Shopping Offer by ID
  async getShoppingOffer(id: number) {
    try {
      const response = await client.entities.shopping_offers.get({
        id: String(id),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shopping offer:', error);
      return null;
    }
  },

  // Transport Routes
  async getTransportRoutes(filters?: { from_city?: string; to_city?: string; type?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.from_city) query.from_city = filters.from_city;
      if (filters?.to_city) query.to_city = filters.to_city;
      if (filters?.type) query.type = filters.type;

      const response = await client.entities.transport_routes.query({
        query,
        sort: 'departure',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch transport routes:', error);
      return [];
    }
  },

  // Rental Companies
  async getRentalCompanies() {
    try {
      const response = await client.entities.rental_companies.query({
        sort: '-rating',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch rental companies:', error);
      return [];
    }
  },

  // Taxi Info
  async getTaxiInfo() {
    try {
      const response = await client.entities.taxi_info.query({
        sort: 'price_min',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch taxi info:', error);
      return [];
    }
  },

  // Featured Restaurants
  async getFeaturedRestaurants(section?: string) {
    try {
      const query: Record<string, unknown> = {};
      if (section) query.featured_section = section;

      const response = await client.entities.featured_restaurants.query({
        query,
        sort: 'sort_order',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch featured restaurants:', error);
      return [];
    }
  },

  // Emergency Services
  async getEmergencyServices(filters?: { category?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.category) query.category = filters.category;

      const response = await client.entities.emergency_services.query({
        query,
        sort: 'priority',
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch emergency services:', error);
      return [];
    }
  },

  // Knowledge Articles
  async getKnowledgeArticles(filters?: { category?: string }) {
    try {
      const query: Record<string, unknown> = {};
      if (filters?.category) query.category = filters.category;

      const response = await client.entities.knowledge_articles.query({
        query,
        limit: 50,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch knowledge articles:', error);
      return [];
    }
  },

  // Knowledge Article by ID
  async getKnowledgeArticle(id: number) {
    try {
      const response = await client.entities.knowledge_articles.get({
        id: String(id),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch knowledge article:', error);
      return null;
    }
  },

  // Shabbat Times
  async getShabbatTimes(city?: string) {
    try {
      const query: Record<string, unknown> = { is_current: true };
      if (city) query.city = city;

      const response = await client.entities.shabbat_times.query({
        query,
        limit: 10,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch shabbat times:', error);
      return [];
    }
  },

  // App Languages
  async getAppLanguages() {
    try {
      const response = await client.entities.app_languages.query({
        sort: 'sort_order',
        limit: 20,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch app languages:', error);
      return [];
    }
  },

  // Onboarding Cards
  async getOnboardingCards() {
    try {
      const response = await client.entities.onboarding_cards.query({
        sort: 'sort_order',
        limit: 10,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch onboarding cards:', error);
      return [];
    }
  },

  // Dashboard Modules
  async getDashboardModules() {
    try {
      const response = await client.entities.dashboard_modules.query({
        sort: 'sort_order',
        limit: 20,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch dashboard modules:', error);
      return [];
    }
  },

  // Quick Access Items
  async getQuickAccessItems() {
    try {
      const response = await client.entities.quick_access_items.query({
        sort: 'sort_order',
        limit: 10,
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch quick access items:', error);
      return [];
    }
  },
};