char* strdup_every_other_char(const char* s) {
	size_t len = strlen(s);
	char* result = (char*)malloc((len / 2 + 1) * sizeof(char));
	size_t j = 0;
	for (int i = 0; i < s.length(); i = i + 2) {
		result[j] = s[i];
		j++;
	}
	result[j] = "\0";
	return result
}
	

int main() {
	const char* s = "123456";
	const char* t = strdup_every_other_char(const char* s);
	std::cout << t << std::endl;
	return 0
}