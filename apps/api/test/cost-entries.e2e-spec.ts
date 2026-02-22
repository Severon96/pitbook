import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CostEntriesModule } from '../src/cost-entries/cost-entries.module';
import { VehiclesModule } from '../src/vehicles/vehicles.module';
import { DrizzleModule } from '../src/drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';

describe('CostEntriesController (e2e)', () => {
  let app: INestApplication;
  let vehicleId: string;
  let createdCostEntryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        DrizzleModule,
        VehiclesModule,
        CostEntriesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create a test vehicle
    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .send({
        name: 'Test Vehicle for Cost Entries',
        brand: 'BMW',
        model: '3 Series',
        year: 2022,
        type: 'DAILY',
      });
    vehicleId = vehicleRes.body.id;
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdCostEntryId) {
      await request(app.getHttpServer()).delete(`/cost-entries/${createdCostEntryId}`);
    }
    if (vehicleId) {
      await request(app.getHttpServer()).delete(`/vehicles/${vehicleId}`);
    }
    await app.close();
  });

  describe('/cost-entries (POST)', () => {
    it('should create a cost entry with date string', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'FUEL',
          title: 'Gas Station Fillup',
          date: '2024-03-15T10:30:00.000Z',
          totalAmount: 65.50,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.vehicleId).toBe(vehicleId);
          expect(res.body.category).toBe('FUEL');
          expect(res.body.title).toBe('Gas Station Fillup');
          expect(res.body.totalAmount).toBe('65.50');
          expect(new Date(res.body.date).toISOString()).toBe('2024-03-15T10:30:00.000Z');
          createdCostEntryId = res.body.id;
        });
    });

    it('should create a cost entry with ISO date string (date only)', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'SERVICE',
          title: 'Oil Change',
          date: '2024-04-20',
          totalAmount: 89.99,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.date).toBeDefined();
          const returnedDate = new Date(res.body.date);
          expect(returnedDate.getFullYear()).toBe(2024);
          expect(returnedDate.getMonth()).toBe(3); // April is month 3 (0-indexed)
          expect(returnedDate.getDate()).toBe(20);
        });
    });

    it('should create a cost entry with itemized breakdown', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'REPAIR',
          title: 'Brake Service',
          date: '2024-05-10T00:00:00.000Z',
          items: [
            { description: 'Brake Pads Front', quantity: 2, unitPrice: 45.00 },
            { description: 'Brake Pads Rear', quantity: 2, unitPrice: 40.00 },
            { description: 'Labor', quantity: 2, unitPrice: 75.00 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.items).toHaveLength(3);
          expect(res.body.totalAmount).toBe('320.00'); // Calculated from items
          expect(res.body.items[0].description).toBe('Brake Pads Front');
        });
    });

    it('should calculate total from items when items provided', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'PARTS',
          title: 'New Tires',
          date: '2024-06-01T00:00:00.000Z',
          items: [
            { description: 'Tire', quantity: 4, unitPrice: 120.00 },
            { description: 'Installation', quantity: 1, unitPrice: 80.00 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.totalAmount).toBe('560.00');
        });
    });

    it('should use provided totalAmount when no items', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'INSURANCE',
          title: 'Annual Insurance',
          date: '2024-01-01T00:00:00.000Z',
          totalAmount: 1200.00,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.totalAmount).toBe('1200.00');
          expect(res.body.items).toHaveLength(0);
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'FUEL',
          // Missing title and date
        })
        .expect(400);
    });

    it('should return 400 for invalid category', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'INVALID_CATEGORY',
          title: 'Test',
          date: '2024-03-15T00:00:00.000Z',
          totalAmount: 50,
        })
        .expect(400);
    });

    it('should create cost entry with notes', () => {
      return request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'OTHER',
          title: 'Car Wash',
          date: '2024-07-15T00:00:00.000Z',
          totalAmount: 25.00,
          notes: 'Premium wash with wax',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.notes).toBe('Premium wash with wax');
        });
    });

    it('should handle different date formats correctly', async () => {
      const dateFormats = [
        '2024-08-15T14:30:00.000Z',
        '2024-08-15',
        new Date('2024-08-15').toISOString(),
      ];

      for (const dateFormat of dateFormats) {
        const res = await request(app.getHttpServer())
          .post('/cost-entries')
          .send({
            vehicleId,
            category: 'FUEL',
            title: `Test Date Format: ${dateFormat}`,
            date: dateFormat,
            totalAmount: 50,
          })
          .expect(201);

        expect(res.body.date).toBeDefined();
        expect(new Date(res.body.date)).toBeInstanceOf(Date);
      }
    });
  });

  describe('/cost-entries (GET)', () => {
    it('should return cost entries for a vehicle', async () => {
      // First create a cost entry
      await request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'FUEL',
          title: 'Test Entry for GET',
          date: '2024-09-01T00:00:00.000Z',
          totalAmount: 60,
        });

      return request(app.getHttpServer())
        .get(`/cost-entries?vehicleId=${vehicleId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('vehicleId');
          expect(res.body[0]).toHaveProperty('category');
          expect(res.body[0]).toHaveProperty('date');
        });
    });

    it('should return 400 when vehicleId is missing', () => {
      return request(app.getHttpServer())
        .get('/cost-entries')
        .expect(400);
    });
  });

  describe('/cost-entries/:id (GET)', () => {
    it('should return a single cost entry', async () => {
      // Create a cost entry first
      const createRes = await request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'TAX',
          title: 'Vehicle Tax',
          date: '2024-10-01T00:00:00.000Z',
          totalAmount: 150,
        });

      const entryId = createRes.body.id;

      return request(app.getHttpServer())
        .get(`/cost-entries/${entryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(entryId);
          expect(res.body.category).toBe('TAX');
        });
    });

    it('should return 404 for non-existent cost entry', () => {
      return request(app.getHttpServer())
        .get('/cost-entries/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });
  });

  describe('/cost-entries/:id (DELETE)', () => {
    it('should delete a cost entry', async () => {
      // Create a cost entry specifically for deletion
      const createRes = await request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'OTHER',
          title: 'Entry to Delete',
          date: '2024-11-01T00:00:00.000Z',
          totalAmount: 30,
        });

      const entryId = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/cost-entries/${entryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(entryId);
        });
    });

    it('should return 404 when deleting non-existent cost entry', () => {
      return request(app.getHttpServer())
        .delete('/cost-entries/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });

    it('should cascade delete cost entry items', async () => {
      // Create entry with items
      const createRes = await request(app.getHttpServer())
        .post('/cost-entries')
        .send({
          vehicleId,
          category: 'SERVICE',
          title: 'Service with Items to Delete',
          date: '2024-12-01T00:00:00.000Z',
          items: [
            { description: 'Part A', quantity: 1, unitPrice: 10 },
            { description: 'Part B', quantity: 2, unitPrice: 20 },
          ],
        });

      const entryId = createRes.body.id;

      // Delete the entry
      await request(app.getHttpServer())
        .delete(`/cost-entries/${entryId}`)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/cost-entries/${entryId}`)
        .expect(404);
    });
  });
});
