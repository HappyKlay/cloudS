package org.clouds.server.repository;

import org.clouds.server.model.UserSecurity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSecurityRepository extends CrudRepository<UserSecurity, Long> {
    
    @Query("SELECT us FROM UserSecurity us WHERE us.userId = :userId")
    UserSecurity getUserSecurityByUserId(@Param("userId") Integer userId);
} 