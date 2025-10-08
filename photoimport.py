import psycopg2
import os

# Connect to the database
conn = psycopg2.connect("dbname=plu_db user=zHause password=QqQ411414")
cur = conn.cursor()

# Path to the pictures folder
pictures_path = r'C:\Users\info\Downloads\Pictures'

for filename in os.listdir(pictures_path):
    if filename.endswith('.jpg'):
        # Construct the full file path
        file_path = os.path.join(pictures_path, filename)
        with open(file_path, 'rb') as file:
            # Extract member number from the filename
            member_number = int(filename.split('.')[0])
            # Update the database
            cur.execute("UPDATE memberships SET photo = %s WHERE membership_number = %s", (file.read(), member_number))

# Commit changes and close the connection
conn.commit()
cur.close()
conn.close()
