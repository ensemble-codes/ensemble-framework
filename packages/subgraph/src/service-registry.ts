import { ServiceRegistered, ServiceUpdated } from '../generated/ServiceRegistry/ServiceRegistry'
import { Service } from '../generated/schema'

export function handleServiceRegistered(event: ServiceRegistered): void {
    let entity = new Service(event.params.serviceId.toString());

    entity.name = event.params.name;
    entity.description = event.params.description;

    entity.save();
}

export function handleServiceUpdated(event: ServiceUpdated): void {
    let entity = Service.load(event.params.serviceId.toString());
    if (entity == null) {
        return
    }

    entity.name = event.params.name;
    entity.description = event.params.description;

    entity.save();
}