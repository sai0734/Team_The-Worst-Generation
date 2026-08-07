package com.backend.babysitter.service;

public interface BabysitterPickService {

    boolean toggle(String sitterEmail, String pickerEmail);

    long countBySitter(String sitterEmail);

    boolean isPicked(String sitterEmail, String pickerEmail);
}
