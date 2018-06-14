-- ----------------
-- for fire alarm
-- ----------------
CREATE TABLE IF NOT EXISTS ctec_fire_alarms (
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    occurrences varchar(64),
    msg varchar(64),
    sensor varchar(64),
    primary key (id)
);

insert into ctec_fire_alarms (occurrences, msg, sensor) values ('2018-06-11 05:31:38', '1', 'Fire09');
insert into ctec_fire_alarms (occurrences, msg, sensor) values ('2018-06-11 05:33:38', '0', 'Fire09');


