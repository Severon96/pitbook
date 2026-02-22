import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReportsModule } from '../src/reports/reports.module';
import { VehiclesModule } from '../src/vehicles/vehicles.module';
import { CostEntriesModule } from '../src/cost-entries/cost-entries.module';
import { DrizzleModule } from '../src/drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  let vehicleId: string;
  let costEntryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        DrizzleModule,
        VehiclesModule,
        CostEntriesModule,
        ReportsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create a test vehicle
    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .send({
        name: 'Test Vehicle for Reports',
        brand: 'Honda',
        model: 'Accord',
        year: 2023,
        type: 'DAILY',
      });
    vehicleId = vehicleRes.body.id;

    // Create a test cost entry
    const costEntryRes = await request(app.getHttpServer())
      .post('/cost-entries')
      .send({
        vehicleId,
        category: 'FUEL',
        title: 'Test Fuel Entry',
        date: new Date('2024-06-15').toISOString(),
        totalAmount: 75.50,
      });
    costEntryId = costEntryRes.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (costEntryId) {
      await request(app.getHttpServer()).delete(`/cost-entries/${costEntryId}`);
    }
    if (vehicleId) {
      await request(app.getHttpServer()).delete(`/vehicles/${vehicleId}`);
    }
    await app.close();
  });

  describe('/reports/vehicle/:vehicleId (GET)', () => {
    it('should return a cost report for a vehicle', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('vehicle');
          expect(res.body.vehicle.id).toBe(vehicleId);
          expect(res.body).toHaveProperty('summary');
          expect(res.body.summary).toHaveProperty('totalAmount');
          expect(res.body.summary).toHaveProperty('entryCount');
          expect(res.body.summary).toHaveProperty('byCategory');
          expect(res.body).toHaveProperty('entries');
          expect(Array.isArray(res.body.entries)).toBe(true);
        });
    });

    it('should filter by date range', async () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}`)
        .query({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('period');
          expect(res.body.period.from).toBeDefined();
          expect(res.body.period.to).toBeDefined();
        });
    });

    it('should return 404 for non-existent vehicle', () => {
      return request(app.getHttpServer())
        .get('/reports/vehicle/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });

    it('should return report with correct cost aggregation', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.summary.totalAmount).toBeGreaterThan(0);
          expect(res.body.summary.entryCount).toBeGreaterThan(0);
          expect(res.body.summary.byCategory).toBeDefined();
          expect(typeof res.body.summary.byCategory).toBe('object');
        });
    });
  });

  describe('/reports/vehicle/:vehicleId/csv (GET)', () => {
    it('should export cost report as CSV', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}/csv`)
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect((res) => {
          expect(res.text).toContain('Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag');
          expect(res.text).toContain('FUEL');
          expect(res.text).toContain('Test Fuel Entry');
        });
    });

    it('should export CSV with date range filter', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}/csv`)
        .query({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        })
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect((res) => {
          expect(res.text).toContain('Datum,Kategorie,Titel');
        });
    });

    it('should return 404 for non-existent vehicle CSV export', () => {
      return request(app.getHttpServer())
        .get('/reports/vehicle/123e4567-e89b-12d3-a456-426614174000/csv')
        .expect(404);
    });

    it('should include proper CSV headers in response', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}/csv`)
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect('Content-Disposition', /attachment; filename="cost-report.csv"/);
    });
  });

  describe('CSV export with itemized entries', () => {
    let itemizedCostEntryId: string;

    beforeAll(async () => {
      // Create a cost entry with items
      const costEntryRes = await request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'SERVICE',
          title: 'Oil Change with Items',
          date: new Date('2024-07-20').toISOString(),
          items: [
            { description: 'Oil Filter', quantity: 1, unitPrice: 12.50 },
            { description: 'Motor Oil 5L', quantity: 5, unitPrice: 8.00 },
          ],
        });
      itemizedCostEntryId = costEntryRes.body.id;
    });

    afterAll(async () => {
      if (itemizedCostEntryId) {
        await request(app.getHttpServer()).delete(`/cost-entries/${itemizedCostEntryId}`);
      }
    });

    it('should export itemized entries correctly in CSV', () => {
      return request(app.getHttpServer())
        .get(`/reports/vehicle/${vehicleId}/csv`)
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Oil Filter');
          expect(res.text).toContain('Motor Oil 5L');
          expect(res.text).toContain('1,12.50');
          expect(res.text).toContain('5,8.00');
        });
    });
  });
});
