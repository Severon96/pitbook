import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { VehiclesModule } from '../src/vehicles/vehicles.module';
import { DrizzleModule } from '../src/drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';

describe('VehiclesController (e2e)', () => {
  let app: INestApplication;
  let createdVehicleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        DrizzleModule,
        VehiclesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdVehicleId) {
      await request(app.getHttpServer())
        .delete(`/vehicles/${createdVehicleId}`);
    }
    await app.close();
  });

  describe('/vehicles (POST)', () => {
    it('should create a new vehicle', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .send({
          name: 'E2E Test Vehicle',
          brand: 'Toyota',
          model: 'Camry',
          year: 2023,
          type: 'DAILY',
          licensePlate: 'TEST-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E Test Vehicle');
          expect(res.body.brand).toBe('Toyota');
          expect(res.body.type).toBe('DAILY');
          createdVehicleId = res.body.id;
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .send({
          name: 'Invalid Vehicle',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/vehicles (GET)', () => {
    it('should return all vehicles', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('_count');
          }
        });
    });
  });

  describe('/vehicles/:id (GET)', () => {
    it('should return a single vehicle', async () => {
      if (!createdVehicleId) {
        // Create a vehicle first if not exists
        const createRes = await request(app.getHttpServer())
          .post('/vehicles')
          .send({
            name: 'Test Vehicle for GET',
            brand: 'Honda',
            model: 'Civic',
            year: 2023,
            type: 'DAILY',
          });
        createdVehicleId = createRes.body.id;
      }

      return request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdVehicleId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('brand');
        });
    });

    it('should return 404 for non-existent vehicle', () => {
      return request(app.getHttpServer())
        .get('/vehicles/non-existent-id')
        .expect(404);
    });
  });

  describe('/vehicles/:id (PUT)', () => {
    it('should update a vehicle', async () => {
      if (!createdVehicleId) {
        const createRes = await request(app.getHttpServer())
          .post('/vehicles')
          .send({
            name: 'Test Vehicle for UPDATE',
            brand: 'Mazda',
            model: 'CX-5',
            year: 2023,
            type: 'DAILY',
          });
        createdVehicleId = createRes.body.id;
      }

      return request(app.getHttpServer())
        .put(`/vehicles/${createdVehicleId}`)
        .send({
          name: 'Updated Test Vehicle',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Vehicle');
        });
    });

    it('should return 404 when updating non-existent vehicle', () => {
      return request(app.getHttpServer())
        .put('/vehicles/non-existent-id')
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });
  });

  describe('/vehicles/:id/summary (GET)', () => {
    it('should return vehicle cost summary', async () => {
      if (!createdVehicleId) {
        const createRes = await request(app.getHttpServer())
          .post('/vehicles')
          .send({
            name: 'Test Vehicle for SUMMARY',
            brand: 'Ford',
            model: 'Focus',
            year: 2023,
            type: 'DAILY',
          });
        createdVehicleId = createRes.body.id;
      }

      return request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}/summary`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('entryCount');
          expect(res.body).toHaveProperty('byCategory');
          expect(Array.isArray(res.body.byCategory)).toBe(true);
        });
    });
  });

  describe('/vehicles/:id (DELETE)', () => {
    it('should delete a vehicle', async () => {
      // Create a vehicle specifically for deletion
      const createRes = await request(app.getHttpServer())
        .post('/vehicles')
        .send({
          name: 'Test Vehicle for DELETE',
          brand: 'Nissan',
          model: 'Altima',
          year: 2023,
          type: 'DAILY',
        });
      const vehicleIdToDelete = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/vehicles/${vehicleIdToDelete}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(vehicleIdToDelete);
        });
    });

    it('should return 404 when deleting non-existent vehicle', () => {
      return request(app.getHttpServer())
        .delete('/vehicles/non-existent-id')
        .expect(404);
    });
  });
});
