package com.pcd.dto.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.pcd.dto.enums.Permission.*;

@Getter
@RequiredArgsConstructor
public enum Role {
    ADMIN(Set.of(ADMIN_READ, ADMIN_UPDATE, ADMIN_CREATE, ADMIN_DELETE,INVESTIGATOR_SUBMIT,INVESTIGATOR_READ,LAWYER_READ, LAWYER_SUBMIT, LAWYER_EXPORT,JUDGE_READ, JUDGE_HISTORY,EXPERT_ANALYZE, EXPERT_UPLOAD, EXPERT_ANNOTATE, EXPERT_REPORT)),
    INVESTIGATOR(Set.of(INVESTIGATOR_READ, INVESTIGATOR_SUBMIT)),
    LAWYER(Set.of(LAWYER_READ, LAWYER_SUBMIT, LAWYER_EXPORT)),
    JUDGE(Set.of(JUDGE_READ, JUDGE_HISTORY)),
    EXPERT(Set.of(EXPERT_ANALYZE, EXPERT_UPLOAD, EXPERT_ANNOTATE, EXPERT_REPORT));



    private final Set<Permission> permissions;

    public List<SimpleGrantedAuthority> getAuthorities() {
        var authorities = getPermissions().stream()
                .map(permission -> new SimpleGrantedAuthority(permission.getPermission()))
                .collect(Collectors.toList());
        authorities.add(new SimpleGrantedAuthority("ROLE_"+this.name()));
        return authorities;
    }

    public SimpleGrantedAuthority getRole() {

        return new SimpleGrantedAuthority("ROLE_"+this.name());

    }
}
