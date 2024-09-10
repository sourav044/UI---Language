using System.Collections.Generic;
using System.Windows;

namespace ResxEditor
{
    public partial class AddNodeWindow : Window
    {
        public string NewKey { get; private set; }
        public Dictionary<string, string> NewValues { get; private set; }

        private Dictionary<string, TextBox> fileTextBoxes = new Dictionary<string, TextBox>();

        public AddNodeWindow(Dictionary<string, Dictionary<string, string>> resxData)
        {
            InitializeComponent();

            foreach (var fileName in resxData.Keys)
            {
                StackPanel filePanel = new StackPanel { Orientation = Orientation.Horizontal };
                Label fileLabel = new Label { Content = fileName, Width = 100 };
                TextBox valueEntry = new TextBox { Width = 200 };

                filePanel.Children.Add(fileLabel);
                filePanel.Children.Add(valueEntry);

                FileEntries.Items.Add(filePanel);
                fileTextBoxes[fileName] = valueEntry;
            }
        }

        private void OkButton_Click(object sender, RoutedEventArgs e)
        {
            NewKey = KeyEntry.Text;
            NewValues = new Dictionary<string, string>();

            foreach (var entry in fileTextBoxes)
            {
                NewValues[entry.Key] = entry.Value.Text;
            }

            DialogResult = true;
            Close();
        }
    }
}
