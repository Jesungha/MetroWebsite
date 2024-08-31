-- Table Type I



UPDATE Sales_Table AS s1
SET s1.acttype = (
    SELECT s2.acttype 
    FROM (SELECT * FROM Sales_Table) AS s2 
    WHERE s1.armastiid = s2.armastiid 
    AND s2.acttype != ''
    LIMIT 1
)
WHERE s1.acttype = '';


SELECT LEFT(s.itmdesc, 10) as PhoneNumber, s1.itmdesc as PhoneName,   s.adddate, s.armastiid, s.acttype from Sales_Table s
INNER JOIN Sales_Table s1 ON (s.armastiid = s1.armastiid AND s.itmdesc <> s1.itmdesc AND s1.serial != "" AND s1.serial NOT LIKE "%F")
WHERE (s.acttype = 'New Activation' or s.acttype= 'Upgrade') AND (s.itmdesc LIKE '%FEATURE CHANGE%' or s.itmdesc LIKE '%ACTIVATION PAYMENT%')
;

--Table Type II

SELECT d1.actdate as Date, d1.Mobile as PhoneNumber, IF(d1.itemdesc = "", "BYOD", d1.itemdesc) as PhoneName, d1.acttype, d1.plandesc as Plan FROM dump_table d1;