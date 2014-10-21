'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the types delete service
     * 
     * @param {int} id      Document mongoose ID
     * @return {Promise}
     */
    service.call = function(id) {
        
        
        service.models.Type.findById(id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The right type has been deleted'));
                        
                        var righttype = document.toObject();
                        righttype.$outcome = service.outcome;
                        
                        service.deferred.resolve(righttype);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};
