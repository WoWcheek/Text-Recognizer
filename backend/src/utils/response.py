class Error:
    @staticmethod
    def generateError(errorCode, errorMessage):
        return {
            'code': errorCode,
            'message': errorMessage
        }

    @staticmethod
    def customError(errorCode=None, errorMessage=None):
        return Error.generateError(errorCode, errorMessage)
    
    @staticmethod
    def badRequest():
        return Error.generateError(400, 'Bad Request.')
    
    @staticmethod
    def unAuthorized():
        return Error.generateError(401, 'Unauthorized.')
    
    @staticmethod
    def forbidden():
        return Error.generateError(403, 'Access denied.')
    
    @staticmethod
    def notFound():
        return Error.generateError(404, 'Not Found.')
    
    @staticmethod
    def serverError():
        return Error.generateError(500, 'Internal server error')

  

class Response:
    @staticmethod
    def create(ok: bool, message: str = None, data: any = None, error: Error = None) -> dict:
        return {
            'ok': ok,
            'message': message,
            'data': data,
            'error': error
        }